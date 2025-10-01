import { useState, useEffect, useRef, useCallback } from 'react';
import { getTTSConfig, getVoiceForText } from '@/lib/ttsConfig';
import { generateSpeechWithCache, EdgeTTSConfig } from '@/lib/edgeTTS';
import { generateXTTSSpeechWithCache, XTTSConfig } from '@/lib/xttsTTS';

interface TTSOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  lang?: string;
  forceEngine?: 'web-speech' | 'edge-tts' | 'xtts'; // Override default engine
}

export const useTTS = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [currentEngine, setCurrentEngine] = useState<'web-speech' | 'edge-tts'>('web-speech');

  // Web Speech API refs
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Edge TTS refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Common refs
  const textQueueRef = useRef<string[]>([]);
  const currentTextRef = useRef<string>('');
  const wordTimingsRef = useRef<number[]>([]);

  useEffect(() => {
    // Check if Speech Synthesis API is supported
    const supported = 'speechSynthesis' in window;
    setIsSupported(supported);

    if (supported) {
      // Load voices - Chrome requires this to initialize voice list
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        console.log('[TTS] Available voices:', voices.length);
        if (voices.length > 0) {
          console.log('[TTS] Sample voices:', voices.slice(0, 3).map(v => `${v.name} (${v.lang})`));
        }
      };

      // Load voices immediately
      loadVoices();

      // Also listen for voiceschanged event (Chrome loads voices asynchronously)
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    } else {
      console.warn('[TTS] Speech Synthesis API not supported in this browser');
    }

    return () => {
      // Cleanup on unmount
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speakWithWebSpeech = useCallback((text: string, options: TTSOptions = {}) => {
    if (!text) {
      console.warn('[TTS] No text provided to speak');
      return;
    }

    if (!window.speechSynthesis) {
      console.error('[TTS] Speech Synthesis not available');
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    console.log('[TTS] Starting Web Speech synthesis');

    // Store current text for word tracking
    currentTextRef.current = text;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = options.rate || 1.0;
    utterance.pitch = options.pitch || 1.0;
    utterance.volume = options.volume || 1.0;
    utterance.lang = options.lang || 'en-US';

    // Try to select an appropriate voice
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      // Prefer voices that match the language
      const matchingVoice = voices.find(v => v.lang.startsWith(utterance.lang.split('-')[0]));
      if (matchingVoice) {
        utterance.voice = matchingVoice;
        console.log('[TTS] Using voice:', matchingVoice.name);
      } else {
        console.log('[TTS] Using default voice');
      }
    }

    utterance.onstart = () => {
      console.log('[TTS] Speech started');
      setIsPlaying(true);
      setIsPaused(false);
      setCurrentEngine('web-speech');
      setCurrentWordIndex(0);
      setCurrentCharIndex(0);
    };

    utterance.onboundary = (event) => {
      if (event.name === 'word') {
        // Update character position
        setCurrentCharIndex(event.charIndex);

        // Calculate word index based on character position
        const words = text.slice(0, event.charIndex).split(/\s+/).filter(w => w.length > 0);
        setCurrentWordIndex(words.length);
      }
    };

    utterance.onerror = (event) => {
      console.error('[TTS] Speech error:', event.error, event);
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentWordIndex(-1);
      setCurrentCharIndex(0);
    };

    utterance.onend = () => {
      console.log('[TTS] Speech ended');
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentWordIndex(-1);
      setCurrentCharIndex(0);

      // If there are more texts in queue, speak the next one
      if (textQueueRef.current.length > 0) {
        const nextText = textQueueRef.current.shift();
        if (nextText) {
          speak(nextText, options);
        }
      }
    };

    utteranceRef.current = utterance;

    try {
      window.speechSynthesis.speak(utterance);
      console.log('[TTS] Utterance queued for speaking');
    } catch (error) {
      console.error('[TTS] Failed to queue utterance:', error);
      setIsPlaying(false);
      setIsPaused(false);
    }
  }, []);

  const speakWithEdgeTTS = useCallback(async (text: string, options: TTSOptions = {}) => {
    if (!text) return;

    try {
      // Stop any current playback
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      // Store current text
      currentTextRef.current = text;

      // Get TTS config
      const config = getTTSConfig();

      // Get voice based on text language and user preferences
      const { voice: selectedVoice, lang: detectedLang } = getVoiceForText(text);

      console.log('[Edge TTS] Voice selection:', {
        detectedLanguage: detectedLang,
        selectedVoice: selectedVoice,
        userConfiguredVoice: config.edgeTTSVoice,
        textPreview: text.substring(0, 50)
      });

      // Prepare Edge TTS config
      const edgeConfig: EdgeTTSConfig = {
        serverUrl: config.edgeTTSServerUrl,
        voice: selectedVoice,
        rate: config.edgeTTSRate,
        pitch: config.edgeTTSPitch,
      };

      setIsPlaying(true);
      setIsPaused(false);
      setCurrentEngine('edge-tts');
      setCurrentWordIndex(0);
      setCurrentCharIndex(0);

      // Generate speech
      const audioBlob = await generateSpeechWithCache(text, edgeConfig);
      const audioUrl = URL.createObjectURL(audioBlob);

      // Create and play audio
      const audio = new Audio(audioUrl);
      audio.volume = options.volume || 1.0;

      // Calculate approximate word timings for highlighting
      const words = text.split(/\s+/).filter(w => w.length > 0);
      const estimatedDuration = text.length / 10; // Rough estimate: 10 chars per second

      audio.onloadedmetadata = () => {
        const actualDuration = audio.duration;
        const timePerWord = actualDuration / words.length;

        // Update word index periodically
        let currentWord = 0;
        const interval = setInterval(() => {
          if (!audio.paused && currentWord < words.length) {
            setCurrentWordIndex(currentWord);
            currentWord++;
          } else {
            clearInterval(interval);
          }
        }, timePerWord * 1000);

        audio.onended = () => {
          clearInterval(interval);
          setIsPlaying(false);
          setIsPaused(false);
          setCurrentWordIndex(-1);
          setCurrentCharIndex(0);
          URL.revokeObjectURL(audioUrl);

          // If there are more texts in queue, speak the next one
          if (textQueueRef.current.length > 0) {
            const nextText = textQueueRef.current.shift();
            if (nextText) {
              speak(nextText, options);
            }
          }
        };

        audio.onpause = () => {
          if (audio.currentTime < audio.duration) {
            setIsPaused(true);
          }
        };

        audio.onplay = () => {
          setIsPaused(false);
        };
      };

      audio.onerror = (error) => {
        console.error('Audio playback error:', error);
        setIsPlaying(false);
        setIsPaused(false);
        setCurrentWordIndex(-1);
        setCurrentCharIndex(0);
        URL.revokeObjectURL(audioUrl);
      };

      audioRef.current = audio;
      await audio.play();

    } catch (error) {
      console.error('Edge TTS error:', error);
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentWordIndex(-1);
      setCurrentCharIndex(0);

      // Fallback to Web Speech
      console.log('Falling back to Web Speech API');
      speakWithWebSpeech(text, options);
    }
  }, [speakWithWebSpeech]);

  const speakWithXTTS = useCallback(async (text: string, options: TTSOptions = {}) => {
    if (!text) return;

    try {
      // Stop any current playback
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      // Store current text
      currentTextRef.current = text;

      // Get TTS config
      const config = getTTSConfig();
      const voiceInfo = getVoiceForText(text);

      // Prepare XTTS config
      const xttsConfig: XTTSConfig = {
        serverUrl: config.xttsServerUrl,
        voice: config.xttsVoice,
        language: voiceInfo.lang,
        speed: config.xttsSpeed,
      };

      setIsPlaying(true);
      setIsPaused(false);
      setCurrentEngine('xtts');
      setCurrentWordIndex(0);
      setCurrentCharIndex(0);

      // Generate speech
      const audioBlob = await generateXTTSSpeechWithCache(text, xttsConfig);
      const audioUrl = URL.createObjectURL(audioBlob);

      // Create and play audio
      const audio = new Audio(audioUrl);
      audio.volume = options.volume || 1.0;

      // Calculate approximate word timings for highlighting
      const words = text.split(/\s+/).filter(w => w.length > 0);

      audio.onloadedmetadata = () => {
        const actualDuration = audio.duration;
        const timePerWord = actualDuration / words.length;

        // Update word index periodically
        let currentWord = 0;
        const interval = setInterval(() => {
          if (!audio.paused && currentWord < words.length) {
            setCurrentWordIndex(currentWord);
            currentWord++;
          } else {
            clearInterval(interval);
          }
        }, timePerWord * 1000);

        audio.onended = () => {
          clearInterval(interval);
          setIsPlaying(false);
          setIsPaused(false);
          setCurrentWordIndex(-1);
          setCurrentCharIndex(0);
          URL.revokeObjectURL(audioUrl);

          // If there are more texts in queue, speak the next one
          if (textQueueRef.current.length > 0) {
            const nextText = textQueueRef.current.shift();
            if (nextText) {
              speak(nextText, options);
            }
          }
        };

        audio.onpause = () => {
          if (audio.currentTime < audio.duration) {
            setIsPaused(true);
          }
        };

        audio.onplay = () => {
          setIsPaused(false);
        };
      };

      audio.onerror = (error) => {
        console.error('Audio playback error:', error);
        setIsPlaying(false);
        setIsPaused(false);
        setCurrentWordIndex(-1);
        setCurrentCharIndex(0);
        URL.revokeObjectURL(audioUrl);
      };

      audioRef.current = audio;
      await audio.play();

    } catch (error) {
      console.error('XTTS error:', error);
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentWordIndex(-1);
      setCurrentCharIndex(0);

      // Fallback to Edge TTS, then Web Speech
      console.log('Falling back to Edge TTS');
      speakWithEdgeTTS(text, options);
    }
  }, [speakWithEdgeTTS]);

  const speak = useCallback((text: string, options: TTSOptions = {}) => {
    if (!text) return;

    // Determine which engine to use
    const config = getTTSConfig();
    const engine = options.forceEngine || config.engine;

    if (engine === 'xtts') {
      speakWithXTTS(text, options);
    } else if (engine === 'edge-tts') {
      speakWithEdgeTTS(text, options);
    } else {
      speakWithWebSpeech(text, options);
    }
  }, [speakWithXTTS, speakWithEdgeTTS, speakWithWebSpeech]);

  const pause = useCallback(() => {
    if (currentEngine === 'edge-tts' && audioRef.current) {
      audioRef.current.pause();
      setIsPaused(true);
    } else if (currentEngine === 'web-speech') {
      if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
        window.speechSynthesis.pause();
        setIsPaused(true);
      }
    }
  }, [currentEngine]);

  const resume = useCallback(() => {
    if (currentEngine === 'edge-tts' && audioRef.current) {
      audioRef.current.play();
      setIsPaused(false);
    } else if (currentEngine === 'web-speech') {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        setIsPaused(false);
      }
    }
  }, [currentEngine]);

  const stop = useCallback(() => {
    // Stop Web Speech
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    // Stop Edge TTS
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    setIsPlaying(false);
    setIsPaused(false);
    setCurrentWordIndex(-1);
    setCurrentCharIndex(0);
    textQueueRef.current = [];
  }, []);

  const toggle = useCallback((text: string, options: TTSOptions = {}) => {
    if (!isSupported) return;

    if (isPlaying) {
      if (isPaused) {
        resume();
      } else {
        pause();
      }
    } else {
      speak(text, options);
    }
  }, [isSupported, isPlaying, isPaused, speak, pause, resume]);

  const speakQueue = useCallback((texts: string[], options: TTSOptions = {}) => {
    if (!isSupported || texts.length === 0) return;

    textQueueRef.current = texts.slice(1);
    speak(texts[0], options);
  }, [isSupported, speak]);

  return {
    speak,
    pause,
    resume,
    stop,
    toggle,
    speakQueue,
    isPlaying,
    isPaused,
    isSupported,
    currentWordIndex,
    currentCharIndex,
    currentEngine,
  };
};
