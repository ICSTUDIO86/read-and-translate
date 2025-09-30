// Book file parser utilities
import { Book, Chapter, Paragraph } from '@/types/book';
import * as pdfjsLib from 'pdfjs-dist';
import JSZip from 'jszip';

// Set up PDF.js worker - use unpkg CDN
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;

// Parse TXT file
export const parseTxtFile = async (file: File): Promise<Book> => {
  const text = await file.text();
  const lines = text.split('\n').filter(line => line.trim());

  // Simple parsing: treat double line breaks as chapter breaks
  const chapters: Chapter[] = [];
  let currentChapter: Chapter = {
    id: 'ch1',
    title: 'Chapter 1',
    paragraphs: [],
  };

  let paragraphId = 0;
  let chapterCount = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Check if line looks like a chapter title (all caps, starts with "Chapter", etc.)
    const isChapterTitle = /^(CHAPTER|Chapter|第.*章)/i.test(line);

    if (isChapterTitle && currentChapter.paragraphs.length > 0) {
      // Save current chapter and start new one
      chapters.push(currentChapter);
      chapterCount++;
      currentChapter = {
        id: `ch${chapterCount}`,
        title: line,
        paragraphs: [],
      };
    } else if (line.length > 0) {
      // Check if it's a section heading (short line, no punctuation at end)
      const isHeading = line.length < 100 && !line.match(/[.!?]$/) && line.length > 10;

      // Add as paragraph or heading
      currentChapter.paragraphs.push({
        id: `p${paragraphId++}`,
        text: line,
        isHeading: isHeading,
        headingLevel: isHeading ? 3 : undefined,
      });
    }
  }

  // Add last chapter
  if (currentChapter.paragraphs.length > 0) {
    chapters.push(currentChapter);
  }

  // Create book object
  const totalParagraphs = chapters.reduce((sum, ch) => sum + ch.paragraphs.length, 0);

  const bookTitle = file.name.replace(/\.[^/.]+$/, '');
  return {
    id: `uploaded-${Date.now()}`,
    title: bookTitle,
    author: 'Unknown Author',
    cover: 'https://via.placeholder.com/400x600/f59e0b/ffffff?text=' + encodeURIComponent(bookTitle.substring(0, 30)),
    rating: 0,
    pages: Math.ceil(totalParagraphs / 3), // Rough estimate
    language: detectLanguage(text),
    audioLength: '0h0m',
    genre: 'Uploaded',
    synopsis: text.substring(0, 200) + '...',
    isFree: true,
    chapters,
    currentChapter: 0,
    currentParagraph: 0,
  };
};

// Detect language (simple heuristic)
const detectLanguage = (text: string): string => {
  const chineseChars = text.match(/[\u4e00-\u9fa5]/g);
  const totalChars = text.replace(/\s/g, '').length;

  if (chineseChars && chineseChars.length / totalChars > 0.3) {
    return 'Chinese';
  }

  return 'English';
};

// Parse PDF file using pdf.js
export const parsePdfFile = async (file: File): Promise<Book> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    const chapters: Chapter[] = [];
    let currentChapter: Chapter = {
      id: 'ch1',
      title: 'Chapter 1',
      paragraphs: [],
    };

    let paragraphId = 0;
    let chapterCount = 1;
    let allText = '';

    // Extract text and images from all pages
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');

      allText += pageText + '\n';

      // If page has very little text, it might be an image/diagram page
      // Render it as an image
      if (pageText.trim().length < 100) {
        try {
          const viewport = page.getViewport({ scale: 1.5 });
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');

          if (context) {
            canvas.width = viewport.width;
            canvas.height = viewport.height;

            await page.render({
              canvasContext: context,
              viewport: viewport,
            }).promise;

            const imageDataUrl = canvas.toDataURL('image/png');

            currentChapter.paragraphs.push({
              id: `p${paragraphId++}`,
              text: `Page ${i}`,
              isImage: true,
              imageUrl: imageDataUrl,
              imageAlt: `Page ${i} - Image/Diagram`,
            });

            console.log(`Page ${i} rendered as image`);
          }
        } catch (error) {
          console.error(`Failed to render page ${i} as image:`, error);
        }
        continue;
      }

      // Split into paragraphs (by double line breaks or periods followed by spaces)
      const paragraphs = pageText
        .split(/\n\n+|\. {2,}/)
        .filter(p => p.trim().length > 20);

      paragraphs.forEach(text => {
        const trimmed = text.trim();
        if (trimmed) {
          // Check if it's a chapter heading
          const isChapterTitle = /^(CHAPTER|Chapter|第.*章)/i.test(trimmed) && trimmed.length < 100;

          if (isChapterTitle && currentChapter.paragraphs.length > 0) {
            chapters.push(currentChapter);
            chapterCount++;
            currentChapter = {
              id: `ch${chapterCount}`,
              title: trimmed,
              paragraphs: [],
            };
          } else {
            // Check if it's a section heading (short text, no punctuation at end)
            const isHeading = trimmed.length < 100 && !trimmed.match(/[.!?]$/) && trimmed.length > 10;

            currentChapter.paragraphs.push({
              id: `p${paragraphId++}`,
              text: trimmed,
              isHeading: isHeading,
              headingLevel: isHeading ? 3 : undefined,
            });
          }
        }
      });

      // Create a new chapter every 10 pages if no chapter markers found
      if (i % 10 === 0 && currentChapter.paragraphs.length > 5) {
        chapters.push(currentChapter);
        chapterCount++;
        currentChapter = {
          id: `ch${chapterCount}`,
          title: `Chapter ${chapterCount}`,
          paragraphs: [],
        };
      }
    }

    // Add last chapter
    if (currentChapter.paragraphs.length > 0) {
      chapters.push(currentChapter);
    }

    // If no chapters were created, create at least one
    if (chapters.length === 0) {
      chapters.push(currentChapter);
    }

    const totalParagraphs = chapters.reduce((sum, ch) => sum + ch.paragraphs.length, 0);
    const bookTitle = file.name.replace(/\.[^/.]+$/, '');

    return {
      id: `uploaded-${Date.now()}`,
      title: bookTitle,
      author: 'Unknown Author',
      cover: 'https://via.placeholder.com/400x600/f59e0b/ffffff?text=' + encodeURIComponent(bookTitle.substring(0, 30)),
      rating: 0,
      pages: pdf.numPages,
      language: detectLanguage(allText),
      audioLength: '0h0m',
      genre: 'Uploaded',
      synopsis: allText.substring(0, 200) + '...',
      isFree: true,
      chapters,
      currentChapter: 0,
      currentParagraph: 0,
    };
  } catch (error) {
    console.error('PDF parsing error:', error);
    throw new Error('Failed to parse PDF file. The file may be corrupted or password-protected.');
  }
};

// Helper function to convert HTML to plain text
const htmlToText = (html: string): string => {
  if (!html) return '';

  // Create a temporary div element
  const div = document.createElement('div');
  div.innerHTML = html;

  // Remove script and style elements
  const scripts = div.querySelectorAll('script, style, head');
  scripts.forEach(el => el.remove());

  // Get text content and clean it up
  let text = div.textContent || div.innerText || '';

  // Replace multiple spaces and newlines with single space
  text = text.replace(/\s+/g, ' ').trim();

  return text;
};

// Helper function to clean HTML from metadata
const cleanMetadata = (text: string): string => {
  if (!text) return '';

  // Remove all HTML tags
  let cleaned = text.replace(/<[^>]*>/g, ' ');

  // Decode HTML entities
  const div = document.createElement('div');
  div.innerHTML = cleaned;
  cleaned = div.textContent || div.innerText || '';

  // Replace multiple spaces with single space
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return cleaned;
};

// Parse EPUB file using JSZip (browser-compatible)
export const parseEpubFile = async (file: File): Promise<Book> => {
  try {
    console.log('Starting EPUB parsing with JSZip...');

    // Read the EPUB file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);
    console.log('EPUB file unzipped successfully');

    // List all files in the EPUB for debugging
    console.log('Files in EPUB:');
    zip.forEach((relativePath, file) => {
      console.log(`  - ${relativePath}`);
    });

    // Read container.xml to find the path to content.opf
    const containerXml = await zip.file('META-INF/container.xml')?.async('text');
    if (!containerXml) {
      throw new Error('Invalid EPUB: META-INF/container.xml not found');
    }

    // Parse container.xml to get content.opf path
    const parser = new DOMParser();
    const containerDoc = parser.parseFromString(containerXml, 'text/xml');
    const rootfilePath = containerDoc.querySelector('rootfile')?.getAttribute('full-path');

    if (!rootfilePath) {
      throw new Error('Invalid EPUB: rootfile path not found in container.xml');
    }

    console.log('Content.opf path:', rootfilePath);

    // Read content.opf
    const contentOpf = await zip.file(rootfilePath)?.async('text');
    if (!contentOpf) {
      throw new Error('Invalid EPUB: content.opf not found');
    }

    const opfDoc = parser.parseFromString(contentOpf, 'text/xml');

    // Extract metadata
    const titleEl = opfDoc.querySelector('title');
    const creatorEl = opfDoc.querySelector('creator');
    const descriptionEl = opfDoc.querySelector('description');

    const title = cleanMetadata(titleEl?.textContent || file.name.replace(/\.[^/.]+$/, ''));
    const author = cleanMetadata(creatorEl?.textContent || 'Unknown Author');
    const description = cleanMetadata(descriptionEl?.textContent || '');

    console.log('EPUB metadata:', { title, author, description });

    // Get the base path (directory containing content.opf)
    const basePath = rootfilePath.substring(0, rootfilePath.lastIndexOf('/') + 1);

    // Get spine items (reading order)
    const spineItems = opfDoc.querySelectorAll('spine > itemref');
    const manifestItems = new Map();

    // Build manifest map and find cover image
    let coverImagePath = '';
    opfDoc.querySelectorAll('manifest > item').forEach(item => {
      const id = item.getAttribute('id');
      const href = item.getAttribute('href');
      const properties = item.getAttribute('properties');
      const mediaType = item.getAttribute('media-type');

      if (id && href) {
        manifestItems.set(id, href);

        // Check if this is the cover image
        if (
          properties === 'cover-image' ||
          id?.toLowerCase().includes('cover') ||
          (mediaType?.startsWith('image/') && href.toLowerCase().includes('cover'))
        ) {
          coverImagePath = href;
        }
      }
    });

    // Also check for cover in metadata
    if (!coverImagePath) {
      const coverMeta = opfDoc.querySelector('meta[name="cover"]');
      if (coverMeta) {
        const coverId = coverMeta.getAttribute('content');
        if (coverId && manifestItems.has(coverId)) {
          coverImagePath = manifestItems.get(coverId) || '';
        }
      }
    }

    console.log(`Found ${spineItems.length} spine items`);
    console.log('Cover image path:', coverImagePath);

    // Parse chapters
    const chapters: Chapter[] = [];
    let paragraphId = 0;
    let allText = '';

    for (let i = 0; i < spineItems.length; i++) {
      try {
        const itemref = spineItems[i];
        const idref = itemref.getAttribute('idref');

        if (!idref) continue;

        const href = manifestItems.get(idref);
        if (!href) {
          console.log(`Skipping spine item ${idref}: href not found`);
          continue;
        }

        // Construct full path to the content file
        const contentPath = basePath + href;
        console.log(`Loading chapter ${i + 1}/${spineItems.length}: ${contentPath}`);

        // Read the HTML/XHTML content
        const htmlContent = await zip.file(contentPath)?.async('text');
        if (!htmlContent) {
          console.log(`Skipping ${contentPath}: file not found`);
          continue;
        }

        // Log first 500 chars of HTML for debugging
        console.log(`HTML preview: ${htmlContent.substring(0, 500)}`);

        // Parse HTML to extract title and content
        const htmlDoc = parser.parseFromString(htmlContent, 'text/html');

        // Check for images in this chapter
        const allImages = htmlDoc.querySelectorAll('img');
        console.log(`Found ${allImages.length} img tags in this chapter`);

        // Try to extract chapter title from various elements
        let chapterTitle = '';
        const titleElements = [
          htmlDoc.querySelector('h1'),
          htmlDoc.querySelector('h2'),
          htmlDoc.querySelector('h3'),
          htmlDoc.querySelector('.chapter-title'),
          htmlDoc.querySelector('title'),
        ];

        for (const el of titleElements) {
          if (el && el.textContent) {
            const text = cleanMetadata(el.textContent).trim();
            if (text && text.length < 200 && text.length > 0) {
              chapterTitle = text;
              // Remove the title element so it doesn't appear in content
              el.remove();
              break;
            }
          }
        }

        // Extract paragraphs, headings, and images from structured HTML
        const paragraphs: Paragraph[] = [];

        // Helper function to process images
        const processImage = async (imgElement: Element) => {
          const imgSrc = imgElement.getAttribute('src');
          const imgAlt = imgElement.getAttribute('alt') || '';

          if (!imgSrc) {
            console.log('Image element has no src attribute');
            return;
          }

          try {
            console.log(`Processing image: src="${imgSrc}", basePath="${basePath}"`);

            // Build list of possible paths to try
            const possiblePaths: string[] = [];

            // Original path as-is
            possiblePaths.push(imgSrc);

            // If starts with '../', resolve relative to current directory
            if (imgSrc.startsWith('../')) {
              const currentDir = basePath.split('/').slice(0, -1).join('/');
              const resolvedPath = resolvePath(currentDir, imgSrc);
              possiblePaths.push(resolvedPath);
            }

            // If relative path (no leading slash or http)
            if (!imgSrc.startsWith('http') && !imgSrc.startsWith('/')) {
              // Relative to basePath
              possiblePaths.push(basePath + imgSrc);

              // Try without basePath (might already include it)
              possiblePaths.push(imgSrc);

              // Try finding the image by filename in the entire zip
              const filename = imgSrc.split('/').pop();
              if (filename) {
                // Search for file with this name anywhere in the zip
                zip.forEach((relativePath) => {
                  if (relativePath.endsWith(filename)) {
                    possiblePaths.push(relativePath);
                  }
                });
              }
            }

            // If starts with '/', remove leading slash
            if (imgSrc.startsWith('/')) {
              possiblePaths.push(imgSrc.substring(1));
            }

            // Try removing common prefixes
            const prefixesToTry = ['OEBPS/', 'OPS/', 'EPUB/', 'content/'];
            for (const prefix of prefixesToTry) {
              possiblePaths.push(prefix + imgSrc);
              possiblePaths.push(prefix + imgSrc.replace(/^\.\.\//, ''));
            }

            console.log(`Trying ${possiblePaths.length} possible paths for image "${imgSrc}"`);

            // Try each possible path
            for (const path of possiblePaths) {
              const cleanPath = path.replace(/\/+/g, '/'); // Remove double slashes
              const imageFile = zip.file(cleanPath);

              if (imageFile) {
                console.log(`✓ Found image at: ${cleanPath}`);

                const imageBlob = await imageFile.async('blob');
                const imageDataUrl = await new Promise<string>((resolve) => {
                  const reader = new FileReader();
                  reader.onloadend = () => resolve(reader.result as string);
                  reader.readAsDataURL(imageBlob);
                });

                paragraphs.push({
                  id: `p${paragraphId++}`,
                  text: imgAlt || 'Image',
                  isImage: true,
                  imageUrl: imageDataUrl,
                  imageAlt: imgAlt,
                });
                console.log(`Image extracted successfully from: ${cleanPath}`);
                return;
              }
            }

            console.warn(`✗ Image file not found. Tried paths:`, possiblePaths);
          } catch (error) {
            console.error(`Failed to extract image "${imgSrc}":`, error);
          }
        };

        // Helper function to resolve relative paths
        const resolvePath = (base: string, relative: string): string => {
          const baseParts = base.split('/').filter(p => p);
          const relativeParts = relative.split('/').filter(p => p);

          for (const part of relativeParts) {
            if (part === '..') {
              baseParts.pop();
            } else if (part !== '.') {
              baseParts.push(part);
            }
          }

          return baseParts.join('/');
        };

        // Get body or main content element
        const bodyElement = htmlDoc.querySelector('body') || htmlDoc.documentElement;

        // First, extract ALL images from the entire document
        const allImagesInDoc = htmlDoc.querySelectorAll('img');
        console.log(`Processing ${allImagesInDoc.length} images from querySelectorAll`);
        for (const img of allImagesInDoc) {
          await processImage(img);
        }

        // Process all direct children recursively for text content
        const processElement = async (element: Element) => {
          const tagName = element.tagName.toLowerCase();

          // Skip images (already processed above)
          if (tagName === 'img') {
            return;
          }

          // Handle headings
          if (tagName.match(/^h[1-6]$/)) {
            const text = element.textContent?.trim() || '';
            if (text && text !== chapterTitle && text.length > 0) {
              const headingLevel = parseInt(tagName.charAt(1));
              paragraphs.push({
                id: `p${paragraphId++}`,
                text: text,
                isHeading: true,
                headingLevel: headingLevel,
              });
            }
            return;
          }

          // Handle paragraphs
          if (tagName === 'p') {
            const text = element.textContent?.trim() || '';
            // Add the text content
            if (text && text.length >= 20) {
              paragraphs.push({
                id: `p${paragraphId++}`,
                text: text,
              });
            }
            return;
          }

          // For container elements, check if they have block-level children
          const containerTags = ['div', 'section', 'article', 'main', 'body', 'figure', 'aside', 'header', 'footer', 'nav'];
          if (containerTags.includes(tagName)) {
            // Check if this element has any block-level children
            const hasBlockChildren = element.querySelector('p, div, section, h1, h2, h3, h4, h5, h6');

            if (hasBlockChildren) {
              // Process children recursively
              for (const child of element.children) {
                await processElement(child);
              }
            } else {
              // This is a leaf node with text content
              const text = element.textContent?.trim() || '';
              if (text && text.length >= 20) {
                // Check if it looks like a heading
                const looksLikeHeading = text.length < 100 && !text.match(/[.!?,;]$/);

                paragraphs.push({
                  id: `p${paragraphId++}`,
                  text: text,
                  isHeading: looksLikeHeading,
                  headingLevel: looksLikeHeading ? 4 : undefined,
                });
              }
            }
            return;
          }

          // For other elements, process children if they exist
          if (element.children.length > 0) {
            for (const child of element.children) {
              await processElement(child);
            }
          }
        };

        // Process all children of body
        for (const child of bodyElement.children) {
          await processElement(child);
        }

        // If no structured elements found, fall back to plain text parsing
        if (paragraphs.length === 0) {
          const chapterText = htmlToText(htmlContent);

          if (chapterText.length < 100) {
            console.log(`Skipping short chapter: ${chapterText.length} chars`);
            continue;
          }

          allText += chapterText + ' ';

          const sentences = chapterText.match(/[^.!?]+[.!?]+/g) || [chapterText];
          let currentParagraph = '';

          for (const sentence of sentences) {
            currentParagraph += sentence;

            if (currentParagraph.length > 150) {
              const trimmed = currentParagraph.trim();
              if (trimmed.length > 30) {
                paragraphs.push({
                  id: `p${paragraphId++}`,
                  text: trimmed,
                });
              }
              currentParagraph = '';
            }
          }

          if (currentParagraph.trim().length > 30) {
            paragraphs.push({
              id: `p${paragraphId++}`,
              text: currentParagraph.trim(),
            });
          }
        } else {
          // Add all text for language detection
          allText += paragraphs.map(p => p.text).join(' ') + ' ';
        }

        // Only add chapter if it has content
        if (paragraphs.length > 0) {
          // Use extracted title or fallback to default
          const finalTitle = chapterTitle || `Chapter ${chapters.length + 1}`;
          chapters.push({
            id: `ch${chapters.length + 1}`,
            title: finalTitle,
            paragraphs,
          });
          console.log(`Chapter ${chapters.length} added: "${finalTitle}" with ${paragraphs.length} paragraphs`);
        }
      } catch (chapterError) {
        console.error(`Error loading chapter ${i}:`, chapterError);
        // Continue with next chapter
      }
    }

    // If no chapters were successfully parsed, throw error
    if (chapters.length === 0) {
      throw new Error('No readable content found in EPUB file');
    }

    const totalParagraphs = chapters.reduce((sum, ch) => sum + ch.paragraphs.length, 0);
    console.log(`Successfully parsed EPUB: ${chapters.length} chapters, ${totalParagraphs} paragraphs`);

    // Extract cover image as data URL
    let coverUrl = 'https://via.placeholder.com/400x600/f59e0b/ffffff?text=' + encodeURIComponent(title.substring(0, 30));

    if (coverImagePath) {
      try {
        const fullCoverPath = basePath + coverImagePath;
        console.log('Extracting cover from:', fullCoverPath);

        const coverFile = zip.file(fullCoverPath);
        if (coverFile) {
          const coverBlob = await coverFile.async('blob');
          coverUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(coverBlob);
          });
          console.log('Cover image extracted successfully');
        }
      } catch (error) {
        console.error('Failed to extract cover image:', error);
      }
    }

    return {
      id: `uploaded-${Date.now()}`,
      title: title,
      author: author,
      cover: coverUrl,
      rating: 0,
      pages: Math.ceil(totalParagraphs / 3),
      language: detectLanguage(allText),
      audioLength: '0h0m',
      genre: 'Uploaded',
      synopsis: description || allText.substring(0, 200) + '...',
      isFree: true,
      chapters,
      currentChapter: 0,
      currentParagraph: 0,
    };
  } catch (error) {
    console.error('EPUB parsing error:', error);
    throw new Error(`Failed to parse EPUB file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Main parser function
export const parseBookFile = async (file: File): Promise<Book | null> => {
  const extension = file.name.split('.').pop()?.toLowerCase();

  try {
    switch (extension) {
      case 'txt':
        return await parseTxtFile(file);
      case 'pdf':
        return await parsePdfFile(file);
      case 'epub':
        return await parseEpubFile(file);
      default:
        throw new Error(`Unsupported file format: ${extension}`);
    }
  } catch (error) {
    console.error('Error parsing book file:', error);
    return null;
  }
};

// Validate file
export const validateBookFile = (file: File): { valid: boolean; error?: string } => {
  const maxSize = 100 * 1024 * 1024; // 100MB (increased from 10MB)
  const allowedTypes = ['txt', 'pdf', 'epub'];
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (!extension || !allowedTypes.includes(extension)) {
    return {
      valid: false,
      error: 'Only TXT, PDF, and EPUB files are supported',
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File size must be less than 100MB',
    };
  }

  return { valid: true };
};
