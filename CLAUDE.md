# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React-based e-book reader application with AI-powered text-to-speech, file upload support (EPUB, PDF, TXT), and bilingual reading features. Built with Vite, TypeScript, React, shadcn-ui, and Tailwind CSS.

## Development Commands

```bash
# Install dependencies
npm i

# Start development server (default: http://localhost:8080)
npm run dev

# Build for production
npm run build

# Build for development (with source maps)
npm run build:dev

# Lint code
npm run lint

# Preview production build
npm run preview
```

## Architecture

### Core Data Flow

The application centers around the `Book` interface (`src/types/book.ts`) which structures books into chapters and paragraphs. Each paragraph can be:
- Regular text content
- A heading (with level 1-6)
- An embedded image (with data URL)

Books can be:
1. **Pre-loaded**: Sample books defined in `src/types/book.ts`
2. **User-uploaded**: Parsed from EPUB/PDF/TXT files via `src/lib/bookParser.ts`

### Key Components

**BookReader** (`src/components/BookReader.tsx`)
- Main reading interface with page navigation, settings, and TTS controls
- Implements dual-level highlighting during TTS playback:
  - Paragraph-level: Light background (`bg-primary/10`)
  - Word-level: Darker highlight following current word (`bg-primary/60`)
- Handles touch/swipe gestures and keyboard navigation
- Persists reading progress to localStorage

**BookParser** (`src/lib/bookParser.ts`)
- Parses EPUB (via JSZip), PDF (via pdfjs-dist), and TXT files
- Recursively processes HTML structure to extract:
  - Chapter titles from heading elements
  - Regular paragraphs
  - Section headings (detected by structure or heuristics)
  - Embedded images (converted to base64 data URLs)
- Extensive logging for debugging file parsing issues

**useTTS** (`src/hooks/useTTS.ts`)
- Wraps browser Web Speech API (SpeechSynthesis)
- Tracks word boundaries via `onboundary` events
- Returns `currentCharIndex` and `currentWordIndex` for highlighting

**Storage** (`src/lib/storage.ts`)
- Manages localStorage for:
  - Reading progress (book ID, chapter, paragraph)
  - Reader settings (font size, line height, paragraphs per page)
  - User's library (uploaded books)

### Routing Structure

```
/ (Home)                    - Browse sample books
/search                     - Search interface
/book/:id (BookDetail)      - Book details with upload/read actions
/library (Library)          - User's uploaded books
/account                    - User settings
```

## File Upload & Parsing

When users upload a book file:

1. **Validation** (`validateBookFile`): Check file type and size (<100MB)
2. **Parsing** (`parseBookFile`):
   - EPUB: Unzip → Parse OPF manifest → Extract chapters, images, metadata
   - PDF: Extract text per page → Detect chapter markers → Render image-only pages
   - TXT: Split by line breaks → Detect chapter markers
3. **Storage**: Save to localStorage as JSON with embedded images as data URLs
4. **Display**: Render in BookReader with full reading features

### Image Extraction Details

EPUB images are extracted by:
1. Finding all `<img>` tags via `querySelectorAll('img')`
2. Resolving relative paths (handles `../`, `OEBPS/`, etc.)
3. Extracting from zip and converting to base64 data URLs
4. Inserting as image-type paragraphs in the chapter flow

If images aren't appearing, check browser console for:
- "Found X img tags in this chapter" - confirms images in HTML
- "Processing image: src=..." - shows path resolution attempts
- "✓ Found image at: ..." - confirms successful extraction
- "✗ Image file not found" - indicates path resolution failure

## State Management

- **React Query**: API data fetching (configured in App.tsx)
- **LocalStorage**: All persistent data (books, progress, settings)
- **React Router**: Navigation state

## UI Components

Built with shadcn-ui components (Radix UI + Tailwind):
- All UI components in `src/components/ui/`
- Custom components in `src/components/`
- Styling via Tailwind utility classes

## Important Notes

- The development server runs on port 8080 (configured in vite.config.ts)
- PDF.js worker loads from unpkg CDN
- All book data (including images) stored in localStorage has ~5-10MB limit per origin
- TTS is browser-native and may have limited voice options
- Reading progress auto-saves on chapter/page change
