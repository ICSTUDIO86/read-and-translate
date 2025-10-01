# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React-based e-book reader application with multi-engine text-to-speech, file upload support (EPUB, PDF, TXT), bilingual reading with translation, and cloud sync via Supabase. Built with Vite, TypeScript, React, shadcn-ui, and Tailwind CSS.

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

## Environment Variables

Optional configuration via `.env` file (not required for basic functionality):

```bash
# Supabase cloud sync (optional)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Edge TTS server (optional, requires separate backend)
VITE_EDGE_TTS_URL=http://localhost:5002

# XTTS v2 server (optional, requires separate backend)
VITE_XTTS_URL=http://localhost:5001
```

Without these, the app works with localStorage and browser TTS only.

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

**Storage** (`src/lib/storage.ts` and `src/lib/supabaseStorage.ts`)
- Hybrid storage system with localStorage and optional Supabase cloud sync
- `supabaseStorage.ts` provides same API as `storage.ts` with automatic fallback
- Stores: reading progress, reader settings, user library, favorites, reading stats
- Requires env vars: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for cloud features
- If Supabase not configured, gracefully falls back to localStorage only

**TTS Configuration** (`src/lib/ttsConfig.ts`)
- Supports three engines: Web Speech API (browser-native), Edge TTS, XTTS v2
- Edge TTS and XTTS require separate backend servers (configured via env)
- Auto-detects language from text content (Chinese, Japanese, Korean, English)
- Configurable per engine: voice, rate, pitch, speed

**Translation** (`src/lib/translation.ts`)
- Three providers: MyMemory (default, free), LibreTranslate, Hugging Face
- MyMemory requires no API key; LibreTranslate can use public instance or self-hosted
- Hugging Face requires free API key from huggingface.co
- Supports batch translation with rate limiting and progress callbacks

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

- **React Query**: API data fetching and cache management
- **Storage Layer**: Hybrid localStorage + Supabase cloud sync (via `supabaseStorage.ts`)
- **Supabase Auth**: Email-based authentication for cross-device sync
- **React Router**: Navigation state

## UI Components

Built with shadcn-ui components (Radix UI + Tailwind):
- All UI components in `src/components/ui/`
- Custom components in `src/components/`
- Styling via Tailwind utility classes

## Important Notes

- The development server runs on port 8080 (configured in vite.config.ts)
- PDF.js worker loads from unpkg CDN
- LocalStorage has ~5-10MB limit; cloud sync via Supabase has no practical limit
- TTS: Web Speech API works everywhere; Edge TTS and XTTS require backend servers
- Translation: MyMemory (default) works without setup; others need configuration
- All cloud features (Supabase sync, advanced TTS) are optional and gracefully degrade
- Reading progress auto-saves to both localStorage and cloud (if authenticated)
