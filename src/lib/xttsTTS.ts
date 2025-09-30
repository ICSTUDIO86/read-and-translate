// XTTS v2 API client for emotional, high-quality text-to-speech

export interface XTTSConfig {
  serverUrl: string; // XTTS server URL
  voice: string; // Voice style
  language: string; // Language code
  speed: number; // Speech speed multiplier
}

export interface VoiceInfo {
  id: string;
  name: string;
  description: string;
}

// Get XTTS configuration from localStorage
export const getXTTSConfig = (): XTTSConfig => {
  const serverUrl = localStorage.getItem('xtts_server_url') || 'http://localhost:5001';
  const voice = localStorage.getItem('xtts_voice') || 'female';
  const language = localStorage.getItem('xtts_language') || 'en';
  const speed = parseFloat(localStorage.getItem('xtts_speed') || '1.0');

  return { serverUrl, voice, language, speed };
};

// Save XTTS configuration to localStorage
export const saveXTTSConfig = (config: Partial<XTTSConfig>) => {
  if (config.serverUrl !== undefined) {
    localStorage.setItem('xtts_server_url', config.serverUrl);
  }
  if (config.voice) {
    localStorage.setItem('xtts_voice', config.voice);
  }
  if (config.language) {
    localStorage.setItem('xtts_language', config.language);
  }
  if (config.speed !== undefined) {
    localStorage.setItem('xtts_speed', config.speed.toString());
  }
};

// Fetch available voices from server
export const getAvailableXTTSVoices = async (serverUrl: string): Promise<Record<string, string>> => {
  try {
    const response = await fetch(`${serverUrl}/voices`);
    if (!response.ok) {
      throw new Error(`Failed to fetch voices: ${response.statusText}`);
    }
    const data = await response.json();
    return data.voices || {};
  } catch (error) {
    console.error('Error fetching XTTS voices:', error);
    // Return default voices as fallback
    return {
      female: 'Female voice - warm and expressive',
      male: 'Male voice - calm and professional',
      female_emotional: 'Female voice - highly expressive',
      male_deep: 'Male voice - deep and authoritative',
    };
  }
};

// Generate speech from text using XTTS v2
export const generateXTTSSpeech = async (
  text: string,
  config?: XTTSConfig
): Promise<Blob> => {
  const xttsConfig = config || getXTTSConfig();

  try {
    const response = await fetch(`${xttsConfig.serverUrl}/tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        voice: xttsConfig.voice,
        language: xttsConfig.language,
        speed: xttsConfig.speed,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`XTTS failed: ${errorData.detail || response.statusText}`);
    }

    const audioBlob = await response.blob();
    return audioBlob;
  } catch (error) {
    console.error('XTTS generation error:', error);
    throw error;
  }
};

// Check if XTTS server is available
export const checkXTTSServerHealth = async (serverUrl: string): Promise<boolean> => {
  try {
    const response = await fetch(`${serverUrl}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });
    if (!response.ok) return false;
    const data = await response.json();
    return data.model_loaded === true;
  } catch (error) {
    console.error('XTTS server health check failed:', error);
    return false;
  }
};

// Audio cache using IndexedDB for offline playback
const DB_NAME = 'XTTSCache';
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
export const cacheXTTSAudio = async (key: string, audioBlob: Blob): Promise<void> => {
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
    console.error('Failed to cache XTTS audio:', error);
  }
};

// Retrieve cached audio from IndexedDB
export const getCachedXTTSAudio = async (key: string): Promise<Blob | null> => {
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
    console.error('Failed to get cached XTTS audio:', error);
    return null;
  }
};

// Generate cache key from text and config
export const generateXTTSCacheKey = (text: string, config: XTTSConfig): string => {
  const normalizedText = text.trim().toLowerCase();
  return `xtts_${config.voice}_${config.language}_${config.speed}_${normalizedText.substring(0, 100)}`;
};

// Generate speech with caching
export const generateXTTSSpeechWithCache = async (
  text: string,
  config?: XTTSConfig
): Promise<Blob> => {
  const xttsConfig = config || getXTTSConfig();
  const cacheKey = generateXTTSCacheKey(text, xttsConfig);

  // Try to get from cache first
  const cachedAudio = await getCachedXTTSAudio(cacheKey);
  if (cachedAudio) {
    console.log('Using cached XTTS audio for:', text.substring(0, 50));
    return cachedAudio;
  }

  // Generate new audio
  console.log('Generating new XTTS audio for:', text.substring(0, 50));
  const audioBlob = await generateXTTSSpeech(text, xttsConfig);

  // Cache for future use
  await cacheXTTSAudio(cacheKey, audioBlob);

  return audioBlob;
};
