// Translation service for book content using open-source tools
// Supports LibreTranslate (self-hosted or public) and Hugging Face NLLB model

export interface TranslationConfig {
  apiKey?: string; // Optional for LibreTranslate, required for Hugging Face
  targetLanguage: string; // Default: 'zh' (Chinese)
  provider: 'libretranslate' | 'huggingface' | 'mymemory'; // Translation providers
  serverUrl?: string; // Custom server URL for LibreTranslate
}

// Get translation config from localStorage
export const getTranslationConfig = (): TranslationConfig => {
  const apiKey = localStorage.getItem('translation_api_key') || '';
  const targetLanguage = localStorage.getItem('translation_target_lang') || 'zh';
  const provider = (localStorage.getItem('translation_provider') || 'mymemory') as TranslationConfig['provider'];
  const serverUrl = localStorage.getItem('translation_server_url') || 'https://libretranslate.com';

  return { apiKey, targetLanguage, provider, serverUrl };
};

// Save translation config to localStorage
export const saveTranslationConfig = (config: Partial<TranslationConfig>) => {
  if (config.apiKey !== undefined) {
    localStorage.setItem('translation_api_key', config.apiKey);
  }
  if (config.targetLanguage) {
    localStorage.setItem('translation_target_lang', config.targetLanguage);
  }
  if (config.provider) {
    localStorage.setItem('translation_provider', config.provider);
  }
  if (config.serverUrl) {
    localStorage.setItem('translation_server_url', config.serverUrl);
  }
};

// Language code mapping for LibreTranslate
const mapLanguageCode = (code: string): string => {
  const mapping: Record<string, string> = {
    'zh': 'zh',
    'zh-TW': 'zh',
    'en': 'en',
    'es': 'es',
    'fr': 'fr',
    'de': 'de',
    'ja': 'ja',
    'ko': 'ko',
    'ru': 'ru',
    'pt': 'pt',
    'it': 'it',
    'ar': 'ar',
  };
  return mapping[code] || code;
};

// Translate using LibreTranslate (open-source)
const translateWithLibreTranslate = async (
  text: string,
  targetLang: string,
  serverUrl: string,
  apiKey?: string
): Promise<string> => {
  const url = `${serverUrl}/translate`;

  const body: any = {
    q: text,
    source: 'en', // Auto-detect source language
    target: mapLanguageCode(targetLang),
    format: 'text',
  };

  // Add API key if provided (some instances require it)
  if (apiKey) {
    body.api_key = apiKey;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`LibreTranslate failed: ${errorData.error || response.statusText}`);
  }

  const data = await response.json();
  return data.translatedText.trim();
};

// Translate using MyMemory Translator (Free, no API key needed)
const translateWithMyMemory = async (
  text: string,
  targetLang: string
): Promise<string> => {
  // MyMemory uses different language codes
  const langMapping: Record<string, string> = {
    'zh': 'zh-CN',
    'zh-TW': 'zh-TW',
    'en': 'en',
    'es': 'es',
    'fr': 'fr',
    'de': 'de',
    'ja': 'ja',
    'ko': 'ko',
    'ru': 'ru',
    'pt': 'pt',
    'it': 'it',
    'ar': 'ar',
  };

  const targetCode = langMapping[targetLang] || 'zh-CN';
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${targetCode}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`MyMemory translation failed: ${response.statusText}`);
  }

  const data = await response.json();

  if (data.responseStatus === 200 && data.responseData) {
    return data.responseData.translatedText;
  }

  throw new Error('MyMemory translation failed: Invalid response');
};

// Translate using Hugging Face translation models
const translateWithHuggingFace = async (
  text: string,
  targetLang: string,
  apiKey: string
): Promise<string> => {
  // Use Helsinki-NLP models which are reliable and available
  // Map target language to appropriate model
  const modelMapping: Record<string, string> = {
    'zh': 'Helsinki-NLP/opus-mt-en-zh',
    'zh-TW': 'Helsinki-NLP/opus-mt-en-zh',
    'es': 'Helsinki-NLP/opus-mt-en-es',
    'fr': 'Helsinki-NLP/opus-mt-en-fr',
    'de': 'Helsinki-NLP/opus-mt-en-de',
    'ja': 'Helsinki-NLP/opus-mt-en-jap',
    'ko': 'Helsinki-NLP/opus-mt-en-ko',
    'ru': 'Helsinki-NLP/opus-mt-en-ru',
    'pt': 'Helsinki-NLP/opus-mt-en-pt',
    'it': 'Helsinki-NLP/opus-mt-en-it',
    'ar': 'Helsinki-NLP/opus-mt-en-ar',
  };

  const model = modelMapping[targetLang] || 'Helsinki-NLP/opus-mt-en-zh';

  const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: text,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Hugging Face translation failed: ${errorData.error || response.statusText}`);
  }

  const data = await response.json();

  // Handle different response formats
  if (Array.isArray(data) && data.length > 0) {
    return data[0].translation_text || data[0].generated_text || String(data[0]);
  } else if (data.translation_text) {
    return data.translation_text;
  } else if (data.generated_text) {
    return data.generated_text;
  }

  throw new Error('Unexpected response format from Hugging Face');
};

// Translate a single paragraph
export const translateParagraph = async (text: string, config?: TranslationConfig): Promise<string> => {
  const translationConfig = config || getTranslationConfig();

  try {
    switch (translationConfig.provider) {
      case 'mymemory':
        return await translateWithMyMemory(
          text,
          translationConfig.targetLanguage
        );
      case 'libretranslate':
        return await translateWithLibreTranslate(
          text,
          translationConfig.targetLanguage,
          translationConfig.serverUrl || 'https://libretranslate.com',
          translationConfig.apiKey
        );
      case 'huggingface':
        if (!translationConfig.apiKey) {
          throw new Error('Hugging Face API key required. Get one free at huggingface.co');
        }
        return await translateWithHuggingFace(
          text,
          translationConfig.targetLanguage,
          translationConfig.apiKey
        );
      default:
        throw new Error(`Unknown translation provider: ${translationConfig.provider}`);
    }
  } catch (error) {
    console.error('Translation error:', error);
    throw error;
  }
};

// Translate multiple paragraphs with rate limiting
export const translateParagraphs = async (
  texts: string[],
  config?: TranslationConfig,
  onProgress?: (current: number, total: number) => void
): Promise<string[]> => {
  const results: string[] = [];
  const translationConfig = config || getTranslationConfig();

  // Adjust delay based on provider
  // MyMemory is free but has rate limits - use moderate delay
  // LibreTranslate is self-hosted so can handle faster requests
  // HuggingFace has stricter rate limits
  let delayMs = 200;
  if (translationConfig.provider === 'libretranslate') delayMs = 100;
  if (translationConfig.provider === 'mymemory') delayMs = 300; // Be nice to free service

  for (let i = 0; i < texts.length; i++) {
    try {
      const translation = await translateParagraph(texts[i], config);
      results.push(translation);

      if (onProgress) {
        onProgress(i + 1, texts.length);
      }

      // Rate limiting: shorter delay for better speed
      if (i < texts.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    } catch (error) {
      console.error(`Failed to translate paragraph ${i + 1}:`, error);
      results.push(`[Translation failed: ${texts[i]}]`);
    }
  }

  return results;
};

// Batch translate with chunking for better performance
export const batchTranslate = async (
  texts: string[],
  config?: TranslationConfig,
  onProgress?: (current: number, total: number) => void
): Promise<string[]> => {
  const translationConfig = config || getTranslationConfig();

  // LibreTranslate doesn't require API key for public instance
  // Hugging Face requires API key
  if (translationConfig.provider === 'huggingface' && !translationConfig.apiKey) {
    throw new Error('Hugging Face API key required. Get one free at huggingface.co');
  }

  // Chunk texts into batches of 10 for better progress feedback
  const chunkSize = 10;
  const results: string[] = [];

  for (let i = 0; i < texts.length; i += chunkSize) {
    const chunk = texts.slice(i, i + chunkSize);
    const chunkResults = await translateParagraphs(chunk, config, (current, total) => {
      if (onProgress) {
        onProgress(i + current, texts.length);
      }
    });
    results.push(...chunkResults);
  }

  return results;
};
