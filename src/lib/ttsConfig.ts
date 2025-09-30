// TTS Configuration Management
// Supports Web Speech API, Edge TTS, and XTTS v2

export type TTSEngine = 'web-speech' | 'edge-tts' | 'xtts';

export interface TTSConfiguration {
  engine: TTSEngine;
  // Web Speech API settings
  webSpeechVoice: string;
  webSpeechRate: number;
  webSpeechPitch: number;
  // Edge TTS settings
  edgeTTSServerUrl: string;
  edgeTTSVoice: string;
  edgeTTSRate: string;
  edgeTTSPitch: string;
  // XTTS v2 settings
  xttsServerUrl: string;
  xttsVoice: string;
  xttsLanguage: string;
  xttsSpeed: number;
}

const STORAGE_KEY = 'tts_configuration';

// Default configuration
const DEFAULT_CONFIG: TTSConfiguration = {
  engine: 'web-speech', // Default to Web Speech for immediate availability
  // Web Speech defaults
  webSpeechVoice: '',
  webSpeechRate: 1.0,
  webSpeechPitch: 1.0,
  // Edge TTS defaults
  edgeTTSServerUrl: 'http://localhost:5000',
  edgeTTSVoice: 'zh-CN-XiaoxiaoNeural',
  edgeTTSRate: '+0%',
  edgeTTSPitch: '+0Hz',
  // XTTS v2 defaults
  xttsServerUrl: 'http://localhost:5001',
  xttsVoice: 'female',
  xttsLanguage: 'en',
  xttsSpeed: 1.0,
};

// Get TTS configuration from localStorage
export const getTTSConfig = (): TTSConfiguration => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
    }
    return DEFAULT_CONFIG;
  } catch (error) {
    console.error('Failed to get TTS config:', error);
    return DEFAULT_CONFIG;
  }
};

// Save TTS configuration to localStorage
export const saveTTSConfig = (config: Partial<TTSConfiguration>): void => {
  try {
    const currentConfig = getTTSConfig();
    const newConfig = { ...currentConfig, ...config };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
  } catch (error) {
    console.error('Failed to save TTS config:', error);
  }
};

// Get current TTS engine
export const getTTSEngine = (): TTSEngine => {
  return getTTSConfig().engine;
};

// Set TTS engine
export const setTTSEngine = (engine: TTSEngine): void => {
  saveTTSConfig({ engine });
};

// Voice selection helpers
export const getVoiceForLanguage = (language: string): string => {
  const config = getTTSConfig();

  if (config.engine === 'edge-tts') {
    // Edge TTS voice mapping
    if (language === 'zh' || language === 'zh-CN') {
      return config.edgeTTSVoice || 'zh-CN-XiaoxiaoNeural';
    } else if (language === 'en' || language === 'en-US') {
      return 'en-US-AriaNeural';
    }
    return config.edgeTTSVoice;
  } else {
    // Web Speech voice (will be selected dynamically by browser)
    return config.webSpeechVoice;
  }
};

// Convert rate between formats
export const convertRateToEdgeTTS = (webSpeechRate: number): string => {
  // Web Speech rate: 0.1 to 10 (default 1)
  // Edge TTS rate: -50% to +100%
  const percentage = Math.round((webSpeechRate - 1) * 100);
  return `${percentage >= 0 ? '+' : ''}${percentage}%`;
};

export const convertRateToWebSpeech = (edgeTTSRate: string): number => {
  // Edge TTS rate: "+0%" to Web Speech rate
  const match = edgeTTSRate.match(/([+-]?\d+)%/);
  if (match) {
    const percentage = parseInt(match[1], 10);
    return 1 + percentage / 100;
  }
  return 1.0;
};

// Detect language from text
export const detectLanguage = (text: string): string => {
  // Simple language detection based on character ranges
  const hasChinese = /[\u4e00-\u9fa5]/.test(text);
  const hasJapanese = /[\u3040-\u309f\u30a0-\u30ff]/.test(text);
  const hasKorean = /[\uac00-\ud7af]/.test(text);

  if (hasChinese) return 'zh';
  if (hasJapanese) return 'ja';
  if (hasKorean) return 'ko';
  return 'en';
};

// Get appropriate voice based on text content
export const getVoiceForText = (text: string): { voice: string; lang: string } => {
  const detectedLang = detectLanguage(text);
  const config = getTTSConfig();

  if (config.engine === 'xtts') {
    // XTTS v2 uses language codes directly
    const langMap: Record<string, string> = {
      'zh': 'zh-cn',
      'ja': 'ja',
      'ko': 'ko',
      'en': 'en',
    };
    return {
      voice: config.xttsVoice || 'female',
      lang: langMap[detectedLang] || 'en',
    };
  } else if (config.engine === 'edge-tts') {
    const voiceMap: Record<string, string> = {
      'zh': config.edgeTTSVoice || 'zh-CN-XiaoxiaoNeural',
      'ja': 'ja-JP-NanamiNeural',
      'ko': 'ko-KR-SunHiNeural',
      'en': 'en-US-AriaNeural',
    };
    return {
      voice: voiceMap[detectedLang] || voiceMap['en'],
      lang: detectedLang,
    };
  } else {
    // Web Speech will use browser's default voice for the language
    return {
      voice: config.webSpeechVoice,
      lang: detectedLang === 'zh' ? 'zh-CN' : detectedLang === 'en' ? 'en-US' : detectedLang,
    };
  }
};
