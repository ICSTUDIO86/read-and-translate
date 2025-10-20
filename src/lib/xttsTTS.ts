// XTTS v2 API client for emotional, high-quality text-to-speech
import { splitTextIntoChunks } from './textChunking';

// Maximum text length for a single XTTS request (safe limit)
export const MAX_XTTS_LENGTH = 800;

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

  // Check if text is too long and needs chunking
  if (text.length > MAX_XTTS_LENGTH) {
    console.log(`[XTTS] Text too long (${text.length} chars), using chunked generation`);
    return generateXTTSSpeechForLongText(text, xttsConfig);
  }

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

/**
 * Generate speech for long text by splitting into chunks
 * Automatically handles text longer than XTTS limit
 */
export const generateXTTSSpeechForLongText = async (
  text: string,
  config?: XTTSConfig
): Promise<Blob> => {
  const xttsConfig = config || getXTTSConfig();

  // Check cache for complete long text first
  const cacheKey = generateXTTSCacheKey(text, xttsConfig);
  const cachedAudio = await getCachedXTTSAudio(cacheKey);
  if (cachedAudio) {
    console.log('[XTTS] Using cached audio for long text:', text.substring(0, 50));
    return cachedAudio;
  }

  // Split text into manageable chunks
  const chunks = splitTextIntoChunks(text, MAX_XTTS_LENGTH);
  console.log(`[XTTS] Split into ${chunks.length} chunks for processing`);

  // Generate audio for each chunk
  const audioBlobs: Blob[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    console.log(`[XTTS] Generating chunk ${i + 1}/${chunks.length} (${chunk.text.length} chars)`);

    try {
      // Generate audio for this chunk
      const chunkBlob = await generateXTTSSpeech(chunk.text, xttsConfig);
      audioBlobs.push(chunkBlob);
    } catch (error) {
      console.error(`[XTTS] Failed to generate chunk ${i + 1}:`, error);
      throw new Error(`Failed to generate audio chunk ${i + 1}/${chunks.length}: ${error}`);
    }
  }

  // Merge all audio blobs
  console.log(`[XTTS] Merging ${audioBlobs.length} audio chunks...`);
  const mergedBlob = await mergeXTTSAudioBlobs(audioBlobs);

  // Cache the complete merged audio
  await cacheXTTSAudio(cacheKey, mergedBlob);
  console.log('[XTTS] Long text audio generated and cached successfully');

  return mergedBlob;
};

/**
 * Merge multiple audio blobs into a single blob using Web Audio API
 */
async function mergeXTTSAudioBlobs(blobs: Blob[]): Promise<Blob> {
  if (blobs.length === 0) {
    throw new Error('No audio blobs to merge');
  }

  if (blobs.length === 1) {
    return blobs[0];
  }

  try {
    // Create audio context
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

    // Decode all audio blobs to AudioBuffers
    const audioBuffers: AudioBuffer[] = [];

    for (let i = 0; i < blobs.length; i++) {
      const arrayBuffer = await blobs[i].arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      audioBuffers.push(audioBuffer);
    }

    // Calculate total length
    const totalLength = audioBuffers.reduce((sum, buffer) => sum + buffer.length, 0);
    const sampleRate = audioBuffers[0].sampleRate;
    const numberOfChannels = audioBuffers[0].numberOfChannels;

    // Create a new buffer to hold the merged audio
    const mergedBuffer = audioContext.createBuffer(
      numberOfChannels,
      totalLength,
      sampleRate
    );

    // Copy all buffers into the merged buffer
    let offset = 0;
    for (const buffer of audioBuffers) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        mergedBuffer.getChannelData(channel).set(channelData, offset);
      }
      offset += buffer.length;
    }

    // Convert merged buffer back to blob
    const wavBlob = await audioBufferToWavBlob(mergedBuffer);

    // Close audio context to free resources
    await audioContext.close();

    return wavBlob;
  } catch (error) {
    console.error('[XTTS] Audio merge failed:', error);
    // Fallback: concatenate blobs directly
    console.warn('[XTTS] Using fallback: direct blob concatenation');
    return new Blob(blobs, { type: 'audio/wav' });
  }
}

/**
 * Convert AudioBuffer to WAV Blob
 */
async function audioBufferToWavBlob(audioBuffer: AudioBuffer): Promise<Blob> {
  const numberOfChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  const bytesPerSample = bitDepth / 8;
  const blockAlign = numberOfChannels * bytesPerSample;

  const data = [];
  for (let channel = 0; channel < numberOfChannels; channel++) {
    data.push(audioBuffer.getChannelData(channel));
  }

  const dataLength = audioBuffer.length * numberOfChannels * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer);

  // Write WAV header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numberOfChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(36, 'data');
  view.setUint32(40, dataLength, true);

  // Write audio data
  let offset = 44;
  for (let i = 0; i < audioBuffer.length; i++) {
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, data[channel][i]));
      const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, int16, true);
      offset += 2;
    }
  }

  return new Blob([buffer], { type: 'audio/wav' });
}
