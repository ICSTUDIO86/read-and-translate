// Edge TTS API client for high-quality, free text-to-speech

export interface EdgeTTSConfig {
  serverUrl: string; // Edge TTS server URL
  voice: string; // Voice ID
  rate: string; // Speech rate (-50% to +100%)
  pitch: string; // Pitch adjustment
}

export interface VoiceOption {
  name: string;
  short_name: string;
  gender: string;
  locale: string;
}

// Get Edge TTS configuration from localStorage
export const getEdgeTTSConfig = (): EdgeTTSConfig => {
  const serverUrl = localStorage.getItem('edge_tts_server_url') || 'http://localhost:5000';
  const voice = localStorage.getItem('edge_tts_voice') || 'zh-CN-XiaoxiaoNeural';
  const rate = localStorage.getItem('edge_tts_rate') || '+0%';
  const pitch = localStorage.getItem('edge_tts_pitch') || '+0Hz';

  return { serverUrl, voice, rate, pitch };
};

// Save Edge TTS configuration to localStorage
export const saveEdgeTTSConfig = (config: Partial<EdgeTTSConfig>) => {
  if (config.serverUrl !== undefined) {
    localStorage.setItem('edge_tts_server_url', config.serverUrl);
  }
  if (config.voice) {
    localStorage.setItem('edge_tts_voice', config.voice);
  }
  if (config.rate !== undefined) {
    localStorage.setItem('edge_tts_rate', config.rate);
  }
  if (config.pitch !== undefined) {
    localStorage.setItem('edge_tts_pitch', config.pitch);
  }
};

// Fetch available voices from server
export const getAvailableVoices = async (serverUrl: string): Promise<Record<string, VoiceOption[]>> => {
  try {
    const response = await fetch(`${serverUrl}/voices`);
    if (!response.ok) {
      throw new Error(`Failed to fetch voices: ${response.statusText}`);
    }
    const data = await response.json();
    return data.voices || {};
  } catch (error) {
    console.error('Error fetching voices:', error);
    // Return default voices as fallback
    return {
      'zh-CN': [
        { name: 'Xiaoxiao (Female, CN)', short_name: 'zh-CN-XiaoxiaoNeural', gender: 'Female', locale: 'zh-CN' },
        { name: 'Yunxi (Male, CN)', short_name: 'zh-CN-YunxiNeural', gender: 'Male', locale: 'zh-CN' },
      ],
      'en-US': [
        { name: 'Aria (Female, US)', short_name: 'en-US-AriaNeural', gender: 'Female', locale: 'en-US' },
        { name: 'Guy (Male, US)', short_name: 'en-US-GuyNeural', gender: 'Male', locale: 'en-US' },
      ],
    };
  }
};

// Generate speech from text using Edge TTS
export const generateSpeech = async (
  text: string,
  config?: EdgeTTSConfig
): Promise<Blob> => {
  const ttsConfig = config || getEdgeTTSConfig();

  try {
    const response = await fetch(`${ttsConfig.serverUrl}/tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        voice: ttsConfig.voice,
        rate: ttsConfig.rate,
        pitch: ttsConfig.pitch,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Edge TTS failed: ${errorData.detail || response.statusText}`);
    }

    const audioBlob = await response.blob();
    return audioBlob;
  } catch (error) {
    console.error('Edge TTS generation error:', error);
    throw error;
  }
};

// Check if Edge TTS server is available
export const checkServerHealth = async (serverUrl: string): Promise<boolean> => {
  try {
    const response = await fetch(`${serverUrl}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000), // 3 second timeout
    });
    return response.ok;
  } catch (error) {
    console.error('Edge TTS server health check failed:', error);
    return false;
  }
};

// Audio cache using IndexedDB for offline playback
const DB_NAME = 'EdgeTTSCache';
const STORE_NAME = 'audioCache';
const DB_VERSION = 1;

// Initialize IndexedDB
const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
};

// Cache audio in IndexedDB
export const cacheAudio = async (key: string, audioBlob: Blob): Promise<void> => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.put(audioBlob, key);
    await new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve(undefined);
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (error) {
    console.error('Failed to cache audio:', error);
  }
};

// Retrieve cached audio from IndexedDB
export const getCachedAudio = async (key: string): Promise<Blob | null> => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(key);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to get cached audio:', error);
    return null;
  }
};

// Generate cache key from text and config
export const generateCacheKey = (text: string, config: EdgeTTSConfig): string => {
  const normalizedText = text.trim().toLowerCase();
  return `${config.voice}_${config.rate}_${config.pitch}_${normalizedText.substring(0, 100)}`;
};

// Generate speech with caching
export const generateSpeechWithCache = async (
  text: string,
  config?: EdgeTTSConfig
): Promise<Blob> => {
  const ttsConfig = config || getEdgeTTSConfig();
  const cacheKey = generateCacheKey(text, ttsConfig);

  // Try to get from cache first
  const cachedAudio = await getCachedAudio(cacheKey);
  if (cachedAudio) {
    console.log('Using cached audio for:', text.substring(0, 50));
    return cachedAudio;
  }

  // Generate new audio
  console.log('Generating new audio for:', text.substring(0, 50));
  const audioBlob = await generateSpeech(text, ttsConfig);

  // Cache for future use
  await cacheAudio(cacheKey, audioBlob);

  return audioBlob;
};
