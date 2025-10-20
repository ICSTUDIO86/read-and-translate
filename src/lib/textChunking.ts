/**
 * Text Chunking Utilities for TTS
 * Splits long text into smaller chunks suitable for TTS engines with length limits
 */

export interface TextChunk {
  text: string;
  index: number;
  startOffset: number; // Character offset in original text
  endOffset: number;   // Character offset in original text
}

/**
 * Split text into chunks at sentence boundaries
 * Ensures no chunk exceeds maxChunkSize while keeping sentences intact
 *
 * @param text - The text to split
 * @param maxChunkSize - Maximum characters per chunk (default: 800 for Edge TTS)
 * @returns Array of text chunks with metadata
 */
export function splitTextIntoChunks(
  text: string,
  maxChunkSize: number = 800
): TextChunk[] {
  if (!text || text.length === 0) {
    return [];
  }

  // If text is short enough, return as single chunk
  if (text.length <= maxChunkSize) {
    return [{
      text: text.trim(),
      index: 0,
      startOffset: 0,
      endOffset: text.length
    }];
  }

  const chunks: TextChunk[] = [];

  // Sentence boundary markers (supports both English and Chinese)
  const sentenceEnders = /[.!?。！？]\s*/g;

  // Find all sentence boundaries
  const sentences: { text: string; start: number; end: number }[] = [];
  let lastIndex = 0;
  let match;

  // Reset regex
  sentenceEnders.lastIndex = 0;

  while ((match = sentenceEnders.exec(text)) !== null) {
    const sentenceText = text.substring(lastIndex, match.index + match[0].length);
    if (sentenceText.trim().length > 0) {
      sentences.push({
        text: sentenceText,
        start: lastIndex,
        end: match.index + match[0].length
      });
    }
    lastIndex = match.index + match[0].length;
  }

  // Add remaining text as last sentence
  if (lastIndex < text.length) {
    const remainingText = text.substring(lastIndex);
    if (remainingText.trim().length > 0) {
      sentences.push({
        text: remainingText,
        start: lastIndex,
        end: text.length
      });
    }
  }

  // If no sentences found, split by characters
  if (sentences.length === 0) {
    return splitByCharacters(text, maxChunkSize);
  }

  // Group sentences into chunks
  let currentChunk = '';
  let currentStartOffset = 0;
  let chunkIndex = 0;

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i];

    // If single sentence exceeds maxChunkSize, split it further
    if (sentence.text.length > maxChunkSize) {
      // Save current chunk if exists
      if (currentChunk.length > 0) {
        chunks.push({
          text: currentChunk.trim(),
          index: chunkIndex++,
          startOffset: currentStartOffset,
          endOffset: sentence.start
        });
        currentChunk = '';
      }

      // Split long sentence by characters
      const sentenceChunks = splitByCharacters(sentence.text, maxChunkSize);
      sentenceChunks.forEach(subChunk => {
        chunks.push({
          text: subChunk.text,
          index: chunkIndex++,
          startOffset: sentence.start + subChunk.startOffset,
          endOffset: sentence.start + subChunk.endOffset
        });
      });

      currentStartOffset = sentence.end;
      continue;
    }

    // Try to add sentence to current chunk
    const testChunk = currentChunk + sentence.text;

    if (testChunk.length <= maxChunkSize) {
      // Add to current chunk
      if (currentChunk.length === 0) {
        currentStartOffset = sentence.start;
      }
      currentChunk = testChunk;
    } else {
      // Current chunk is full, save it and start new chunk
      if (currentChunk.length > 0) {
        chunks.push({
          text: currentChunk.trim(),
          index: chunkIndex++,
          startOffset: currentStartOffset,
          endOffset: sentence.start
        });
      }

      // Start new chunk with current sentence
      currentChunk = sentence.text;
      currentStartOffset = sentence.start;
    }
  }

  // Add final chunk if exists
  if (currentChunk.length > 0) {
    chunks.push({
      text: currentChunk.trim(),
      index: chunkIndex++,
      startOffset: currentStartOffset,
      endOffset: text.length
    });
  }

  console.log(`[TextChunking] Split ${text.length} chars into ${chunks.length} chunks`);
  chunks.forEach((chunk, i) => {
    console.log(`  Chunk ${i + 1}: ${chunk.text.length} chars (offset ${chunk.startOffset}-${chunk.endOffset})`);
  });

  return chunks;
}

/**
 * Split text by character count (fallback for text without clear sentence boundaries)
 *
 * @param text - The text to split
 * @param maxChunkSize - Maximum characters per chunk
 * @returns Array of text chunks
 */
function splitByCharacters(text: string, maxChunkSize: number): TextChunk[] {
  const chunks: TextChunk[] = [];
  let offset = 0;
  let chunkIndex = 0;

  while (offset < text.length) {
    const chunkText = text.substring(offset, offset + maxChunkSize);
    chunks.push({
      text: chunkText.trim(),
      index: chunkIndex++,
      startOffset: offset,
      endOffset: Math.min(offset + maxChunkSize, text.length)
    });
    offset += maxChunkSize;
  }

  return chunks;
}

/**
 * Estimate reading time for text in seconds
 * Useful for progress indication
 *
 * @param text - The text to estimate
 * @param wordsPerMinute - Average reading speed (default: 150 for English, 200 for Chinese)
 * @returns Estimated seconds
 */
export function estimateReadingTime(text: string, wordsPerMinute: number = 150): number {
  // Detect if text is primarily Chinese/Japanese/Korean
  const cjkRegex = /[\u4e00-\u9fa5\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/g;
  const cjkMatches = text.match(cjkRegex);
  const isCJK = cjkMatches && cjkMatches.length > text.length * 0.3;

  if (isCJK) {
    // For CJK languages, count characters
    const charCount = text.length;
    const charsPerMinute = wordsPerMinute * 2; // Assume ~2 chars per word
    return Math.ceil((charCount / charsPerMinute) * 60);
  } else {
    // For other languages, count words
    const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
    return Math.ceil((wordCount / wordsPerMinute) * 60);
  }
}
