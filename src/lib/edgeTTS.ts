// Edge TTS API client for high-quality, free text-to-speech
import { splitTextIntoChunks, TextChunk } from './textChunking';

// Maximum text length for a single Edge TTS request (safe limit)
export const MAX_EDGE_TTS_LENGTH = 800;

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
    const response = await fetch(`${ttsConfig.serverUrl}/synthesize`, {
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

  // Check if text is too long and needs chunking
  if (text.length > MAX_EDGE_TTS_LENGTH) {
    console.log(`[Edge TTS] Text too long (${text.length} chars), using chunked generation`);
    return generateSpeechForLongText(text, ttsConfig);
  }

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

/**
 * Generate speech for long text by splitting into chunks
 * Automatically handles text longer than Edge TTS limit
 */
export const generateSpeechForLongText = async (
  text: string,
  config?: EdgeTTSConfig
): Promise<Blob> => {
  const ttsConfig = config || getEdgeTTSConfig();

  // Check cache for complete long text first
  const cacheKey = generateCacheKey(text, ttsConfig);
  const cachedAudio = await getCachedAudio(cacheKey);
  if (cachedAudio) {
    console.log('[Edge TTS] Using cached audio for long text:', text.substring(0, 50));
    return cachedAudio;
  }

  // Split text into manageable chunks
  const chunks = splitTextIntoChunks(text, MAX_EDGE_TTS_LENGTH);
  console.log(`[Edge TTS] Split into ${chunks.length} chunks for processing`);

  // Generate audio for each chunk
  const audioBlobs: Blob[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    console.log(`[Edge TTS] Generating chunk ${i + 1}/${chunks.length} (${chunk.text.length} chars)`);

    try {
      // Generate audio for this chunk (will use cache if available)
      const chunkBlob = await generateSpeech(chunk.text, ttsConfig);
      audioBlobs.push(chunkBlob);
    } catch (error) {
      console.error(`[Edge TTS] Failed to generate chunk ${i + 1}:`, error);
      throw new Error(`Failed to generate audio chunk ${i + 1}/${chunks.length}: ${error}`);
    }
  }

  // Merge all audio blobs using Web Audio API
  console.log(`[Edge TTS] Merging ${audioBlobs.length} audio chunks...`);
  const mergedBlob = await mergeAudioBlobs(audioBlobs);

  // Cache the complete merged audio
  await cacheAudio(cacheKey, mergedBlob);
  console.log('[Edge TTS] Long text audio generated and cached successfully');

  return mergedBlob;
};

/**
 * Merge multiple audio blobs into a single blob using Web Audio API
 * This ensures smooth playback without gaps between chunks
 */
async function mergeAudioBlobs(blobs: Blob[]): Promise<Blob> {
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
    console.error('[Edge TTS] Audio merge failed:', error);
    // Fallback: concatenate blobs directly (may have gaps)
    console.warn('[Edge TTS] Using fallback: direct blob concatenation');
    return new Blob(blobs, { type: 'audio/mpeg' });
  }
}

/**
 * Convert AudioBuffer to WAV Blob
 * WAV format is used because it's easier to create from raw PCM data
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
  view.setUint32(16, 16, true); // fmt chunk size
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
