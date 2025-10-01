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

## Sample Books Backup (Removed 2025-10-01)

**Status**: Template books were removed to make the app show only user-uploaded books.
**Rollback**: To restore template books, use the backup data below.

### Template Books Data

The following 6 sample books were defined in `src/types/book.ts`:

```typescript
export const books: Book[] = [
  {
    id: '1',
    title: 'The Psychology Of Money',
    author: 'Morgan Housel',
    cover: '/src/assets/book-psychology-money.jpg',
    rating: 4.4,
    pages: 262,
    language: 'English',
    audioLength: '2h14m',
    genre: 'Finance',
    synopsis: "Doing well with money isn't necessarily about what you know. It's about how you behave. And behavior is hard to teach, even to really smart people.",
    isFree: true,
    progress: 35,
    currentChapter: 0,
    currentParagraph: 0,
    chapters: [
      {
        id: 'ch1',
        title: 'Chapter 1: No One\'s Crazy',
        paragraphs: [
          {
            id: 'p1',
            text: 'Your personal experiences with money make up maybe 0.00000001% of what\'s happened in the world, but maybe 80% of how you think the world works.',
            translation: '你对金钱的个人经历可能只占世界上发生的事情的0.00000001%，但却占了你对世界运作方式看法的80%。',
          },
          {
            id: 'p2',
            text: 'We all do crazy stuff with money, because we\'re all relatively new to this game and what looks crazy to you might make sense to me. But no one is crazy—we all make decisions based on our own unique experiences that seem to make sense to us in a given moment.',
            translation: '我们都会用金钱做一些疯狂的事情，因为我们都是这个游戏的新手，在你看来疯狂的事情对我来说可能很有道理。但没有人是疯狂的——我们都是基于自己独特的经历做出决定，这些决定在当下对我们来说似乎是合理的。',
          },
          {
            id: 'p3',
            text: 'Some people are born into families that encourage education; others are against it. Some are born into flourishing economies encouraging of entrepreneurship; others are born into war and destitution. I want you to be successful, and I want you to earn it. But realize that not all success is due to hard work, and not all poverty is due to laziness. Keep this in mind when judging people, including yourself.',
            translation: '有些人出生在鼓励教育的家庭；有些人则相反。有些人出生在繁荣的经济体中，鼓励创业；有些人则出生在战争和贫困中。我希望你成功，我也希望你通过努力获得成功。但要认识到，并非所有的成功都是由于努力工作，也并非所有的贫困都是由于懒惰。在评判他人（包括你自己）时，请记住这一点。',
          },
          {
            id: 'p4',
            text: 'The challenge for us is that no amount of studying or open-mindedness can genuinely recreate the power of fear and uncertainty. I can read about what it was like to lose everything during the Great Depression. But I don\'t have the emotional scars of those who lived through it.',
            translation: '我们面临的挑战是，再多的学习或开放的心态都无法真正重现恐惧和不确定性的力量。我可以阅读关于大萧条时期失去一切的经历，但我没有那些经历过它的人的情感创伤。',
          },
        ]
      },
      {
        id: 'ch2',
        title: 'Chapter 2: Luck & Risk',
        paragraphs: [
          {
            id: 'p1',
            text: 'Nothing is as good or as bad as it seems. Luck and risk are siblings. They are both the reality that every outcome in life is guided by forces other than individual effort.',
            translation: '事情既没有看起来那么好，也没有看起来那么糟。运气和风险是兄弟姐妹。它们都是现实——生活中的每一个结果都受到个人努力之外的力量的引导。',
          },
          {
            id: 'p2',
            text: 'Bill Gates went to one of the only high schools in the world that had a computer. The school had a Mothers Club that raised money to buy a computer terminal. It was the first high school in the world to have one. That was an incredibly lucky break—and it contributed to his future success.',
            translation: '比尔·盖茨就读于世界上为数不多拥有计算机的高中之一。学校有一个母亲俱乐部，筹集资金购买了一台计算机终端。这是世界上第一所拥有计算机的高中。这是一个令人难以置信的幸运时刻——这对他未来的成功做出了贡献。',
          },
          {
            id: 'p3',
            text: 'But there was another student at that school who was just as skilled as Gates at programming and might have even been more skilled. His name was Kent Evans. He and Gates became best friends and started a company together. But Evans died in a mountaineering accident before he could take the next step.',
            translation: '但那所学校还有另一个学生，他的编程技能和盖茨一样熟练，甚至可能更加熟练。他的名字叫肯特·埃文斯。他和盖茨成为了最好的朋友，并一起创办了一家公司。但埃文斯在登山事故中去世，还没来得及迈出下一步。',
          },
          {
            id: 'p4',
            text: 'The accidental impact of actions outside of your control can be more consequential than the ones you consciously take. But when judging success—both your own and others\'—realize that not all success is due to hard work, and not all poverty is due to laziness.',
            translation: '你无法控制的行动所产生的意外影响，可能比你有意识采取的行动更具影响力。但在评判成功时——无论是你自己的还是他人的——要认识到，并非所有的成功都是由于努力工作，也并非所有的贫困都是由于懒惰。',
          },
        ]
      },
      {
        id: 'ch3',
        title: 'Chapter 3: Never Enough',
        paragraphs: [
          {
            id: 'p1',
            text: 'When rich people do crazy things. There is no reason to risk what you have and need for what you don\'t have and don\'t need. The hardest financial skill is getting the goalpost to stop moving.',
            translation: '当富人做疯狂的事情时。没有理由为了你没有且不需要的东西而冒险失去你拥有和需要的东西。最难的理财技能是让目标不再移动。',
          },
          {
            id: 'p2',
            text: 'Rajat Gupta was born in Kolkata and orphaned as a teenager. He became the first Indian-born head of McKinsey, the world\'s most prestigious consulting firm. He earned millions of dollars and was on the board of respected institutions. But he got involved in insider trading and was convicted and sentenced to prison.',
            translation: '拉贾特·古普塔出生在加尔各答，十几岁时成为孤儿。他成为世界上最负盛名的咨询公司麦肯锡的第一位印度裔负责人。他赚了数百万美元，并在受人尊敬的机构担任董事。但他卷入了内幕交易，被定罪并判处监禁。',
          },
          {
            id: 'p3',
            text: 'The question we should ask is: Why would someone who has everything take such risks? The answer seems to be that some things are never enough. There is no sense of enough. Modern capitalism is a pro at two things: generating wealth and generating envy.',
            translation: '我们应该问的问题是：为什么一个拥有一切的人会冒这样的风险？答案似乎是，有些东西永远不够。没有"足够"的概念。现代资本主义擅长两件事：创造财富和制造嫉妒。',
          },
          {
            id: 'p4',
            text: 'Happiness, as it\'s said, is just results minus expectations. The hardest financial skill is getting the goalpost to stop moving. But it\'s one of the most important. If expectations rise with results there is no logic in striving for more because you\'ll feel the same after putting in extra effort.',
            translation: '正如所说，幸福就是结果减去期望。最难的理财技能是让目标停止移动。但这是最重要的技能之一。如果期望随着结果而上升，那么追求更多就没有逻辑，因为在付出额外努力后，你会感觉一样。',
          },
        ]
      }
    ]
  },
  {
    id: '2',
    title: 'Sapiens: A Brief History of Humankind',
    author: 'Yuval Noah Harari',
    cover: '/src/assets/book-sapiens.jpg',
    rating: 4.6,
    pages: 443,
    language: 'English',
    audioLength: '15h17m',
    genre: 'History',
    synopsis: "From a renowned historian comes a groundbreaking narrative of humanity's creation and evolution that explores the ways in which biology and history have defined us.",
    isFree: true
  },
  {
    id: '3',
    title: 'The Design of Everyday Things',
    author: 'Don Norman',
    cover: '/src/assets/book-design-everyday.jpg',
    rating: 4.5,
    pages: 368,
    language: 'English',
    audioLength: '11h45m',
    genre: 'Design',
    synopsis: "Design doesn't really start with aesthetics. It starts with understanding the user's needs and creating experiences that are intuitive and enjoyable.",
    isFree: false
  },
  {
    id: '4',
    title: 'Atomic Habits',
    author: 'James Clear',
    cover: '/src/assets/book-atomic-habits.jpg',
    rating: 4.8,
    pages: 320,
    language: 'English',
    audioLength: '5h35m',
    genre: 'Self-Help',
    synopsis: 'No matter your goals, Atomic Habits offers a proven framework for improving every day. James Clear reveals practical strategies that will teach you exactly how to form good habits.',
    isFree: true,
    progress: 67
  },
  {
    id: '5',
    title: 'Deep Work',
    author: 'Cal Newport',
    cover: '/src/assets/book-deep-work.jpg',
    rating: 4.3,
    pages: 304,
    language: 'English',
    audioLength: '7h44m',
    genre: 'Productivity',
    synopsis: "Deep work is the ability to focus without distraction on a cognitively demanding task. It's a skill that allows you to quickly master complicated information.",
    isFree: false
  },
  {
    id: '6',
    title: 'Thinking, Fast and Slow',
    author: 'Daniel Kahneman',
    cover: '/src/assets/book-thinking-fast-slow.jpg',
    rating: 4.2,
    pages: 499,
    language: 'English',
    audioLength: '20h2m',
    genre: 'Psychology',
    synopsis: 'Daniel Kahneman takes us on a groundbreaking tour of the mind and explains the two systems that drive the way we think and make choices.',
    isFree: true
  }
];
```

### Book Cover Images

The following cover images were stored in `src/assets/`:
- `book-psychology-money.jpg`
- `book-sapiens.jpg`
- `book-design-everyday.jpg`
- `book-atomic-habits.jpg`
- `book-deep-work.jpg`
- `book-thinking-fast-slow.jpg`

### How to Restore Template Books

To restore the template books:

1. **Restore book data in `src/types/book.ts`**: Add back the `books` array export shown above
2. **Restore cover images**: Re-add the 6 JPG files to `src/assets/`
3. **Restore page imports**: Add back the image imports and mapping logic in:
   - `src/pages/Home.tsx`
   - `src/pages/BookDetail.tsx`
   - `src/pages/SearchPage.tsx`
   - `src/pages/Library.tsx`
4. **Restore page logic**: Re-enable the code that combines `books` with `uploadedBooks`

### Files Modified During Removal

- `src/types/book.ts` - Removed `books` array
- `src/assets/*.jpg` - Deleted 6 cover images
- `src/pages/Home.tsx` - Removed template book imports and logic
- `src/pages/BookDetail.tsx` - Removed template book imports and logic
- `src/pages/SearchPage.tsx` - Removed template book imports and logic
- `src/pages/Library.tsx` - Removed template book imports and sections
