import { useState, useEffect, useRef } from 'react';
import { Book, Chapter, Paragraph } from '@/types/book';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, List, Settings2, Play, Pause, Volume2, Languages } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTTS } from '@/hooks/useTTS';
import { toast } from 'sonner';
import { saveReadingProgress, getReadingProgress, saveReaderSettings, getReaderSettings, saveBook } from '@/lib/supabaseStorage';
import { batchTranslate, getTranslationConfig } from '@/lib/translation';

interface BookReaderProps {
  book: Book;
  onProgressChange?: (chapterIndex: number, paragraphIndex: number) => void;
  onClose?: () => void;
}

interface ReaderSettings {
  fontSize: number;
  lineHeight: number;
  fontFamily: string;
  showTranslation: boolean;
  paragraphsPerPage: number;
  ttsLanguage: 'original' | 'translated'; // Which language to read with TTS
}

const BookReader = ({ book, onProgressChange, onClose }: BookReaderProps) => {
  // State for current reading position
  const [currentChapterIndex, setCurrentChapterIndex] = useState(book.currentChapter ?? 0);
  const [currentPageInChapter, setCurrentPageInChapter] = useState(0);

  // Load saved settings or use defaults
  const defaultSettings: ReaderSettings = {
    fontSize: 16,
    lineHeight: 1.8,
    fontFamily: 'default',
    showTranslation: false,
    paragraphsPerPage: 10,
    ttsLanguage: 'original',
  };

  const [showChapterList, setShowChapterList] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<ReaderSettings>(defaultSettings);

  // Load saved progress and settings on mount
  useEffect(() => {
    const loadSavedData = async () => {
      // Load saved reading progress
      const savedProgress = await getReadingProgress(book.id);
      if (savedProgress) {
        setCurrentChapterIndex(savedProgress.currentChapter ?? 0);
        // Calculate which page the saved paragraph is on
        const chapters = book.chapters || [];
        const chapter = chapters[savedProgress.currentChapter];
        if (chapter) {
          const paragraphsPerPage = defaultSettings.paragraphsPerPage;
          const pageIndex = Math.floor(savedProgress.currentParagraph / paragraphsPerPage);
          setCurrentPageInChapter(pageIndex);
        }
      }

      // Load saved reader settings
      const savedSettings = await getReaderSettings();
      if (savedSettings) {
        setSettings({ ...defaultSettings, ...savedSettings });
      }
    };

    loadSavedData();
  }, [book.id]);

  // Translation state
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationProgress, setTranslationProgress] = useState({ current: 0, total: 0 });
  const [hasTranslation, setHasTranslation] = useState(false);

  // Touch and swipe handling
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const contentRef = useRef<HTMLDivElement>(null);

  const { speak, pause, resume, stop, isPlaying, isPaused, isSupported, currentWordIndex, currentCharIndex, currentEngine } = useTTS();

  // Track which paragraph is currently being read
  const [readingParagraphIndex, setReadingParagraphIndex] = useState<number>(-1);
  const [paragraphCharOffsets, setParagraphCharOffsets] = useState<number[]>([]);

  const chapters = book.chapters || [];
  const currentChapter = chapters[currentChapterIndex];

  // Debug logging
  console.log('BookReader Debug:', {
    totalChapters: chapters.length,
    currentChapterIndex,
    currentChapter: currentChapter ? {
      title: currentChapter.title,
      paragraphsCount: currentChapter.paragraphs?.length
    } : null,
    settings
  });

  // Ensure paragraphsPerPage has a valid value
  const paragraphsPerPage = settings.paragraphsPerPage || 10;

  // Calculate total pages in current chapter
  const totalPagesInChapter = currentChapter && currentChapter.paragraphs
    ? Math.ceil(currentChapter.paragraphs.length / paragraphsPerPage)
    : 0;

  // Get paragraphs for current page
  const startParagraphIndex = currentPageInChapter * paragraphsPerPage;
  const endParagraphIndex = Math.min(
    startParagraphIndex + paragraphsPerPage,
    currentChapter?.paragraphs?.length || 0
  );
  const currentPageParagraphs = currentChapter?.paragraphs?.slice(
    startParagraphIndex,
    endParagraphIndex
  ) || [];

  useEffect(() => {
    // Save progress to localStorage
    const progressData = {
      bookId: book.id,
      currentChapter: currentChapterIndex,
      currentParagraph: startParagraphIndex,
      lastRead: new Date().toISOString(),
    };

    saveReadingProgress(progressData);
    onProgressChange?.(currentChapterIndex, startParagraphIndex);
  }, [book.id, currentChapterIndex, currentPageInChapter, startParagraphIndex, onProgressChange]);

  // Save progress when user closes or refreshes the page
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Use synchronous localStorage to ensure save completes
      const progressData = {
        bookId: book.id,
        currentChapter: currentChapterIndex,
        currentParagraph: startParagraphIndex,
        lastRead: new Date().toISOString(),
      };

      // Direct localStorage save for reliability on page unload
      try {
        const allProgress = JSON.parse(localStorage.getItem('readingProgress') || '[]');
        const existingIndex = allProgress.findIndex((p: any) => p.bookId === book.id);

        if (existingIndex >= 0) {
          allProgress[existingIndex] = progressData;
        } else {
          allProgress.push(progressData);
        }

        localStorage.setItem('readingProgress', JSON.stringify(allProgress));
        console.log('[BookReader] Saved progress on page unload:', progressData);
      } catch (error) {
        console.error('[BookReader] Failed to save on unload:', error);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Also save when component unmounts
      handleBeforeUnload();
    };
  }, [book.id, currentChapterIndex, startParagraphIndex]);

  // Reset to first page when chapter changes
  useEffect(() => {
    setCurrentPageInChapter(0);
    stop();
  }, [currentChapterIndex, stop]);

  // Save settings whenever they change
  useEffect(() => {
    saveReaderSettings(settings);
  }, [settings]);

  // Reset to first page when paragraphsPerPage changes
  useEffect(() => {
    setCurrentPageInChapter(0);
  }, [settings.paragraphsPerPage]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case 'ArrowLeft':
          goToPrevPage();
          break;
        case 'ArrowRight':
          goToNextPage();
          break;
        case 'Home':
          setCurrentChapterIndex(0);
          setCurrentPageInChapter(0);
          break;
        case 'End':
          setCurrentChapterIndex(chapters.length - 1);
          setCurrentPageInChapter(0);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentChapterIndex, currentPageInChapter, chapters.length]);

  const goToNextPage = () => {
    if (currentPageInChapter < totalPagesInChapter - 1) {
      // Next page in current chapter
      setCurrentPageInChapter(currentPageInChapter + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (currentChapterIndex < chapters.length - 1) {
      // Move to next chapter
      setCurrentChapterIndex(currentChapterIndex + 1);
      setCurrentPageInChapter(0);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToPrevPage = () => {
    if (currentPageInChapter > 0) {
      // Previous page in current chapter
      setCurrentPageInChapter(currentPageInChapter - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (currentChapterIndex > 0) {
      // Move to previous chapter, last page
      setCurrentChapterIndex(currentChapterIndex - 1);
      const prevChapter = chapters[currentChapterIndex - 1];
      if (prevChapter && prevChapter.paragraphs) {
        const prevChapterPages = Math.ceil(prevChapter.paragraphs.length / paragraphsPerPage);
        setCurrentPageInChapter(Math.max(0, prevChapterPages - 1));
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToChapter = async (chapterIndex: number) => {
    setCurrentChapterIndex(chapterIndex);
    setCurrentPageInChapter(0);
    setShowChapterList(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Auto-translate new chapter if not already translated
    const chapter = chapters[chapterIndex];
    if (chapter) {
      // Check if chapter has any translated content
      const hasTranslatedContent = chapter.paragraphs?.some(p => p.type === 'translated' || p.translation);

      if (!hasTranslatedContent) {
        // Wait a moment for UI to settle, then auto-translate
        setTimeout(async () => {
          try {
            await handleTranslateCurrentChapter();
          } catch (error) {
            console.error('[BookReader] Auto-translate failed:', error);
          }
        }, 500);
      }
    }
  };

  // Handle touch start
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  // Handle touch move
  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  // Handle touch end (swipe detection)
  const handleTouchEnd = () => {
    const swipeThreshold = 50; // Minimum swipe distance in pixels
    const diff = touchStartX.current - touchEndX.current;

    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        // Swiped left -> next page
        goToNextPage();
      } else {
        // Swiped right -> previous page
        goToPrevPage();
      }
    }
  };

  // Handle click on left/right side of screen
  const handleContentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Don't trigger if clicking on buttons or interactive elements
    const target = e.target as HTMLElement;
    if (
      target.tagName === 'BUTTON' ||
      target.closest('button') ||
      target.closest('[role="button"]')
    ) {
      return;
    }

    const clickX = e.clientX;
    const screenWidth = window.innerWidth;
    const clickZoneWidth = screenWidth * 0.3; // 30% of screen width on each side

    if (clickX < clickZoneWidth) {
      // Clicked on left side -> previous page
      goToPrevPage();
    } else if (clickX > screenWidth - clickZoneWidth) {
      // Clicked on right side -> next page
      goToNextPage();
    }
  };

  // Calculate overall progress across all chapters
  const getTotalPages = () => {
    return chapters.reduce((total, chapter) => {
      if (!chapter.paragraphs || chapter.paragraphs.length === 0) return total;
      return total + Math.ceil(chapter.paragraphs.length / paragraphsPerPage);
    }, 0);
  };

  const getCurrentGlobalPage = () => {
    let pagesBeforeCurrentChapter = 0;
    for (let i = 0; i < currentChapterIndex; i++) {
      if (chapters[i].paragraphs && chapters[i].paragraphs.length > 0) {
        pagesBeforeCurrentChapter += Math.ceil(chapters[i].paragraphs.length / paragraphsPerPage);
      }
    }
    return pagesBeforeCurrentChapter + currentPageInChapter + 1;
  };

  const totalPages = getTotalPages() || 1; // Prevent division by zero
  const currentGlobalPage = getCurrentGlobalPage() || 1;
  const progress = totalPages > 0 ? (currentGlobalPage / totalPages) * 100 : 0;

  const handlePlayPause = () => {
    if (!isSupported) {
      toast.error('Text-to-Speech not supported', {
        description: 'Your browser does not support TTS functionality',
      });
      return;
    }

    if (isPlaying) {
      if (isPaused) {
        resume();
        toast.info('Resumed reading');
      } else {
        pause();
        toast.info('Paused reading');
      }
    } else {
      // Calculate character offsets for each paragraph (excluding images)
      const offsets: number[] = [];
      let currentOffset = 0;

      currentPageParagraphs.forEach((p) => {
        offsets.push(currentOffset);
        // Only add text length for non-image paragraphs
        if (!p.isImage) {
          currentOffset += p.text.length + 2; // +2 for '. ' separator
        }
      });

      setParagraphCharOffsets(offsets);
      setReadingParagraphIndex(0);

      // Read the paragraphs on current page (excluding images)
      // Filter based on TTS language setting
      console.log('TTS Debug - Current page paragraphs:', currentPageParagraphs.map(p => ({
        text: p.text?.substring(0, 50),
        type: p.type,
        isImage: p.isImage,
        isHeading: p.isHeading
      })));
      console.log('TTS Debug - Settings:', { ttsLanguage: settings.ttsLanguage });

      const paragraphsToRead = currentPageParagraphs.filter(p => {
        if (p.isImage) return false;
        const ttsLang = settings.ttsLanguage || 'original'; // Fallback to 'original'
        if (ttsLang === 'original') {
          return !p.type || p.type === 'original';
        } else {
          return p.type === 'translated';
        }
      });

      console.log('TTS Debug - Paragraphs to read:', paragraphsToRead.length, paragraphsToRead.map(p => p.text?.substring(0, 50)));

      if (paragraphsToRead.length === 0) {
        toast.warning('No text to read', {
          description: settings.ttsLanguage === 'translated'
            ? 'Please translate the book first'
            : 'No original text found',
        });
        return;
      }

      const textToRead = paragraphsToRead.map(p => p.text).join('. ');
      console.log('TTS Debug - Text to read:', textToRead.substring(0, 100));

      if (!isSupported) {
        toast.error('Text-to-Speech not supported', {
          description: 'Your browser does not support speech synthesis. Try Chrome, Edge, or Safari.',
        });
        return;
      }

      try {
        const lang = settings.ttsLanguage === 'translated' ? 'zh-CN' : 'en-US';
        speak(textToRead, { lang, rate: 1.0 });
        console.log('[BookReader] TTS started with engine:', currentEngine);
        toast.success('Started AI reading', {
          description: `Reading page ${currentPageInChapter + 1} with ${currentEngine === 'web-speech' ? 'Web Speech' : currentEngine}`,
        });
      } catch (error) {
        console.error('[BookReader] TTS error:', error);
        toast.error('Failed to start reading', {
          description: error instanceof Error ? error.message : 'Unknown error occurred',
        });
      }
    }
  };

  const handleStop = () => {
    stop();
    setReadingParagraphIndex(-1);
    setParagraphCharOffsets([]);
    toast.info('Stopped reading');
  };

  // Start reading from a specific paragraph
  const handleReadFromParagraph = (startParagraphIndex: number) => {
    if (!isSupported) {
      toast.error('Text-to-Speech not supported');
      return;
    }

    // Stop current playback if any
    if (isPlaying) {
      stop();
    }

    // Calculate character offsets starting from the clicked paragraph
    const offsets: number[] = [];
    let currentOffset = 0;

    currentPageParagraphs.forEach((p, idx) => {
      if (idx < startParagraphIndex) {
        offsets.push(0); // Paragraphs before start point
      } else {
        offsets.push(currentOffset);
        if (!p.isImage) {
          currentOffset += p.text.length + 2;
        }
      }
    });

    setParagraphCharOffsets(offsets);
    setReadingParagraphIndex(startParagraphIndex);

    // Get paragraphs from start point to end of page
    const paragraphsToRead = currentPageParagraphs
      .slice(startParagraphIndex)
      .filter(p => {
        if (p.isImage) return false;
        const ttsLang = settings.ttsLanguage || 'original';
        if (ttsLang === 'original') {
          return !p.type || p.type === 'original';
        } else {
          return p.type === 'translated';
        }
      });

    if (paragraphsToRead.length === 0) {
      toast.warning('No text to read from this position');
      return;
    }

    const textToRead = paragraphsToRead.map(p => p.text).join('. ');
    const lang = settings.ttsLanguage === 'translated' ? 'zh-CN' : 'en-US';

    try {
      speak(textToRead, { lang, rate: 1.0 });
      toast.success('Started reading from selected paragraph');
    } catch (error) {
      console.error('[BookReader] TTS error:', error);
      toast.error('Failed to start reading');
    }
  };

  // Check if book has translation
  useEffect(() => {
    if (!book.chapters) return;

    // Check if any paragraph has type='translated'
    const hasTranslatedParagraphs = book.chapters.some(chapter =>
      chapter.paragraphs.some(p => p.type === 'translated')
    );
    setHasTranslation(hasTranslatedParagraphs);
  }, [book.chapters]);

  // Check if current chapter is already translated
  const isCurrentChapterTranslated = () => {
    if (!currentChapter) return false;
    return currentChapter.paragraphs.some(p => p.type === 'translated');
  };

  // Translate current chapter only
  const handleTranslateCurrentChapter = async () => {
    const config = getTranslationConfig();

    // Check if API key is required for the selected provider
    if (config.provider === 'huggingface' && !config.apiKey) {
      toast.error('Hugging Face API Key Required', {
        description: 'Please configure your free API key in Account settings',
      });
      return;
    }

    if (!currentChapter) {
      toast.error('No chapter selected');
      return;
    }

    if (isCurrentChapterTranslated()) {
      toast.info('This chapter is already translated');
      return;
    }

    setIsTranslating(true);
    setTranslationProgress({ current: 0, total: 0 });

    try {
      // Collect all texts to translate in this chapter
      const textsToTranslate: string[] = [];
      const paragraphIndices: number[] = []; // Track which paragraphs need translation

      currentChapter.paragraphs.forEach((paragraph, index) => {
        if (!paragraph.isImage && !paragraph.isHeading) {
          textsToTranslate.push(paragraph.text);
          paragraphIndices.push(index);
        }
      });

      setTranslationProgress({ current: 0, total: textsToTranslate.length });

      // Batch translate all texts in this chapter
      let translations: string[] = [];
      if (textsToTranslate.length > 0) {
        try {
          translations = await batchTranslate(textsToTranslate, config, (current, total) => {
            setTranslationProgress({ current, total });
          });
        } catch (error) {
          console.error('Batch translation failed for chapter:', currentChapter.title, error);
          toast.error(`Translation failed for chapter: ${currentChapter.title}`);
          setIsTranslating(false);
          return;
        }
      }

      // Build new paragraphs array with originals and translations
      const newParagraphs: Paragraph[] = [];
      let translationIndex = 0;

      for (let i = 0; i < currentChapter.paragraphs.length; i++) {
        const paragraph = currentChapter.paragraphs[i];

        // Add original paragraph
        newParagraphs.push({
          ...paragraph,
          type: 'original',
          language: 'en',
        });

        // Add translated paragraph if this one was translated
        if (paragraphIndices.includes(i)) {
          newParagraphs.push({
            id: `${paragraph.id}_zh`,
            text: translations[translationIndex] || `[Translation missing]`,
            type: 'translated',
            language: 'zh',
          });
          translationIndex++;
        }
      }

      // Create updated book with the translated chapter
      const updatedChapters = book.chapters?.map((chapter, index) => {
        if (index === currentChapterIndex) {
          return {
            ...chapter,
            paragraphs: newParagraphs,
          };
        }
        return chapter;
      }) || [];

      const updatedBook: Book = {
        ...book,
        chapters: updatedChapters,
      };

      // Save updated book
      await saveBook(updatedBook);

      // Update hasTranslation status
      const hasAnyTranslation = updatedBook.chapters?.some(ch =>
        ch.paragraphs.some(p => p.type === 'translated')
      );
      setHasTranslation(hasAnyTranslation || false);

      toast.success('Chapter translated!', {
        description: `Translated ${textsToTranslate.length} paragraphs`,
      });

      // Reload the page to show translations
      window.location.reload();
    } catch (error) {
      console.error('Translation error:', error);
      toast.error('Translation failed', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsTranslating(false);
    }
  };

  // Update current reading paragraph based on character index
  useEffect(() => {
    if (!isPlaying || paragraphCharOffsets.length === 0) {
      return;
    }

    // Find which paragraph we're currently in based on character offset
    for (let i = paragraphCharOffsets.length - 1; i >= 0; i--) {
      if (currentCharIndex >= paragraphCharOffsets[i]) {
        setReadingParagraphIndex(i);
        break;
      }
    }
  }, [currentCharIndex, isPlaying, paragraphCharOffsets]);

  // Helper function to render paragraph with word-level highlighting
  const renderParagraphWithHighlight = (paragraph: Paragraph, paragraphIndex: number) => {
    const isCurrentParagraph = isPlaying && paragraphIndex === readingParagraphIndex;

    // Handle images
    if (paragraph.isImage && paragraph.imageUrl) {
      return (
        <div className="my-6">
          <img
            src={paragraph.imageUrl}
            alt={paragraph.imageAlt || 'Book image'}
            className="max-w-full h-auto rounded-lg shadow-md mx-auto"
            loading="lazy"
          />
          {paragraph.imageAlt && (
            <p className="text-sm text-muted-foreground text-center mt-2 italic">
              {paragraph.imageAlt}
            </p>
          )}
        </div>
      );
    }

    // Determine heading style based on heading level
    const getHeadingStyle = (level?: number) => {
      switch (level) {
        case 1:
          return "text-3xl font-bold mt-8 mb-4";
        case 2:
          return "text-2xl font-bold mt-6 mb-3";
        case 3:
          return "text-xl font-semibold mt-5 mb-3";
        case 4:
          return "text-lg font-semibold mt-4 mb-2";
        case 5:
          return "text-base font-semibold mt-3 mb-2";
        case 6:
          return "text-sm font-semibold mt-3 mb-2";
        default:
          return "text-lg font-semibold mt-4 mb-2";
      }
    };

    // If it's a heading and not being read
    if (paragraph.isHeading && !isCurrentParagraph) {
      const HeadingTag = `h${paragraph.headingLevel || 4}` as keyof JSX.IntrinsicElements;
      return (
        <HeadingTag className={cn("text-foreground", getHeadingStyle(paragraph.headingLevel))}>
          {paragraph.text}
        </HeadingTag>
      );
    }

    // If not currently being read, render normally
    if (!isCurrentParagraph) {
      if (paragraph.isHeading) {
        const HeadingTag = `h${paragraph.headingLevel || 4}` as keyof JSX.IntrinsicElements;
        return (
          <HeadingTag
            className={cn("text-foreground", getHeadingStyle(paragraph.headingLevel))}
            onClick={() => handleReadFromParagraph(paragraphIndex)}
            style={{ cursor: 'pointer' }}
            title="Click to read from here"
          >
            {paragraph.text}
          </HeadingTag>
        );
      }

      // Style translated paragraphs differently
      const isTranslated = paragraph.type === 'translated';
      return (
        <p
          className={cn(
            "leading-relaxed",
            isTranslated
              ? "text-muted-foreground text-sm italic bg-secondary/30 rounded-lg p-3 my-2"
              : "text-foreground",
            "cursor-pointer hover:bg-secondary/20 transition-colors"
          )}
          onClick={() => handleReadFromParagraph(paragraphIndex)}
          title="Click to read from here"
        >
          {paragraph.text}
        </p>
      );
    }

    // Calculate character offset within the current paragraph
    const paragraphStartOffset = paragraphCharOffsets[paragraphIndex] || 0;
    const charIndexInParagraph = currentCharIndex - paragraphStartOffset;

    // Split text into words
    const words = paragraph.text.split(/(\s+)/); // Keep whitespace in array
    let currentOffset = 0;

    const highlightedContent = words.map((word, wordIndex) => {
      const wordStart = currentOffset;
      const wordEnd = currentOffset + word.length;
      currentOffset = wordEnd;

      // Check if this word is currently being read
      const isCurrentWord = charIndexInParagraph >= wordStart && charIndexInParagraph < wordEnd;

      return (
        <span
          key={wordIndex}
          className={cn(
            "transition-all duration-200",
            isCurrentWord && "bg-primary/60 rounded px-1 font-semibold"
          )}
        >
          {word}
        </span>
      );
    });

    // Render with highlighting
    if (paragraph.isHeading) {
      const HeadingTag = `h${paragraph.headingLevel || 4}` as keyof JSX.IntrinsicElements;
      return (
        <HeadingTag
          className={cn(
            "text-foreground bg-primary/10 rounded-lg p-4 transition-all duration-300",
            getHeadingStyle(paragraph.headingLevel),
            "cursor-pointer hover:bg-primary/20"
          )}
          onClick={() => handleReadFromParagraph(paragraphIndex)}
          title="Click to restart reading from here"
        >
          {highlightedContent}
        </HeadingTag>
      );
    }

    return (
      <p
        className="text-foreground leading-relaxed bg-primary/10 rounded-lg p-4 transition-all duration-300 cursor-pointer hover:bg-primary/20"
        onClick={() => handleReadFromParagraph(paragraphIndex)}
        title="Click to restart reading from here"
      >
        {highlightedContent}
      </p>
    );
  };

  if (!currentChapter || !currentChapter.paragraphs || currentChapter.paragraphs.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-background p-8">
        <div className="text-center">
          <p className="text-lg font-medium text-foreground mb-2">No content available</p>
          <p className="text-sm text-muted-foreground mb-4">This chapter appears to be empty</p>
          <Button onClick={onClose} variant="outline">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

        <div className="flex-1 text-center">
          <h3 className="text-sm font-medium truncate">{currentChapter.title}</h3>
          <p className="text-xs text-muted-foreground">
            Page {currentPageInChapter + 1}/{totalPagesInChapter} · Chapter {currentChapterIndex + 1}/{chapters.length}
          </p>
        </div>

        <div className="flex gap-1">
          <Button
            variant={settings.showTranslation ? "default" : "ghost"}
            size="icon"
            onClick={() => {
              const newShowTranslation = !settings.showTranslation;
              setSettings({ ...settings, showTranslation: newShowTranslation });
              saveReaderSettings({ ...settings, showTranslation: newShowTranslation });
              if (newShowTranslation && !hasTranslation) {
                toast.info('Translate the chapter first', {
                  description: 'Click the translate button in settings to translate this chapter'
                });
              }
            }}
            title={settings.showTranslation ? "Hide Translation" : "Show Translation"}
          >
            <Languages className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowChapterList(!showChapterList)}
          >
            <List className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings2 className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1 bg-secondary">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Chapter List Overlay */}
      {showChapterList && (
        <div className="absolute top-16 left-0 right-0 bottom-0 bg-background/100 backdrop-blur-sm z-50 overflow-y-auto overscroll-contain">
          <div className="p-4 pb-24">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Chapters</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowChapterList(false)}
              >
                Close
              </Button>
            </div>
            <div className="space-y-2">
              {chapters.map((chapter, index) => (
                <button
                  key={chapter.id}
                  onClick={() => goToChapter(index)}
                  className={cn(
                    "w-full text-left p-4 rounded-lg transition-colors",
                    index === currentChapterIndex
                      ? "bg-primary text-primary-foreground"
                      : "bg-card hover:bg-secondary"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium break-words">{chapter.title}</p>
                      <p className="text-xs mt-1 opacity-70">
                        {chapter.paragraphs?.length || 0} paragraphs
                      </p>
                    </div>
                    <div className="text-xs opacity-50 flex-shrink-0">
                      {index + 1}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Settings Overlay */}
      {showSettings && (
        <div className="absolute top-16 left-0 right-0 bottom-0 bg-background/100 backdrop-blur-sm z-50 overflow-y-auto overscroll-contain">
          <div className="p-4">
            <h2 className="text-lg font-bold mb-4">Reading Settings</h2>

            <div className="space-y-6">
              {/* Font Size */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Font Size: {settings.fontSize}px
                </label>
                <input
                  type="range"
                  min="12"
                  max="24"
                  value={settings.fontSize}
                  onChange={(e) => setSettings({ ...settings, fontSize: Number(e.target.value) })}
                  className="w-full"
                />
              </div>

              {/* Line Height */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Line Height: {settings.lineHeight}
                </label>
                <input
                  type="range"
                  min="1.2"
                  max="2.5"
                  step="0.1"
                  value={settings.lineHeight}
                  onChange={(e) => setSettings({ ...settings, lineHeight: Number(e.target.value) })}
                  className="w-full"
                />
              </div>

              {/* Font Family */}
              <div>
                <label className="text-sm font-medium mb-2 block">Font</label>
                <div className="grid grid-cols-2 gap-2">
                  {['default', 'serif', 'mono'].map((font) => (
                    <button
                      key={font}
                      onClick={() => setSettings({ ...settings, fontFamily: font })}
                      className={cn(
                        "p-3 rounded-lg border-2 transition-colors capitalize",
                        settings.fontFamily === font
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      {font}
                    </button>
                  ))}
                </div>
              </div>

              {/* Paragraphs Per Page */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Paragraphs Per Page: {settings.paragraphsPerPage}
                </label>
                <input
                  type="range"
                  min="5"
                  max="20"
                  step="1"
                  value={settings.paragraphsPerPage}
                  onChange={(e) => setSettings({ ...settings, paragraphsPerPage: Number(e.target.value) })}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Adjust how many paragraphs to show per page
                </p>
              </div>

              {/* TTS Language Selection */}
              <div>
                <label className="text-sm font-medium mb-2 block">AI Reading Language</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'original', label: 'Original' },
                    { value: 'translated', label: 'Chinese' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setSettings({ ...settings, ttsLanguage: option.value as 'original' | 'translated' })}
                      className={cn(
                        "p-3 rounded-lg border-2 transition-colors",
                        settings.ttsLanguage === option.value
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      )}
                      disabled={option.value === 'translated' && !hasTranslation}
                    >
                      {option.label}
                      {option.value === 'translated' && !hasTranslation && (
                        <span className="block text-xs text-muted-foreground mt-1">
                          (Translate first)
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Show Translation Toggle */}
              <div className="p-4 bg-card rounded-lg border-2 border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Show Translation</p>
                    <p className="text-xs text-muted-foreground">
                      {hasTranslation ? 'Display Chinese translation below text' : 'Translate the book first'}
                    </p>
                  </div>
                  <button
                    onClick={() => setSettings({ ...settings, showTranslation: !settings.showTranslation })}
                    disabled={!hasTranslation}
                    className={cn(
                      "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                      settings.showTranslation && hasTranslation ? "bg-primary" : "bg-secondary",
                      !hasTranslation && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <span
                      className={cn(
                        "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                        settings.showTranslation ? "translate-x-6" : "translate-x-1"
                      )}
                    />
                  </button>
                </div>
              </div>

              {/* Translation Button */}
              <div className="p-4 bg-card rounded-lg border-2 border-border">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium">Translate Chapter</p>
                    <p className="text-xs text-muted-foreground">
                      {isCurrentChapterTranslated() ? 'This chapter is already translated' : `Translate current chapter (${currentChapter?.title || 'Unknown'})`}
                    </p>
                  </div>
                  <Button
                    onClick={handleTranslateCurrentChapter}
                    disabled={isTranslating || isCurrentChapterTranslated()}
                    size="sm"
                  >
                    <Languages className="h-4 w-4 mr-2" />
                    {isTranslating ? 'Translating...' : isCurrentChapterTranslated() ? 'Translated' : 'Translate'}
                  </Button>
                </div>

                {isTranslating && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                      <span>Progress</span>
                      <span>{translationProgress.current} / {translationProgress.total}</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${translationProgress.total > 0
                            ? (translationProgress.current / translationProgress.total) * 100
                            : 0}%`
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content Area */}
      <div
        ref={contentRef}
        className="flex-1 overflow-y-auto px-6 py-8 cursor-pointer select-none relative"
        style={{
          fontSize: `${settings.fontSize}px`,
          lineHeight: settings.lineHeight,
          fontFamily: settings.fontFamily === 'serif' ? 'Georgia, serif' :
                      settings.fontFamily === 'mono' ? 'monospace' : 'inherit',
        }}
        onClick={handleContentClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Click zone indicators (subtle visual hints) */}
        <div className="absolute left-0 top-0 bottom-0 w-[30%] hover:bg-primary/5 transition-colors pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-[30%] hover:bg-primary/5 transition-colors pointer-events-none" />

        <div className="max-w-2xl mx-auto space-y-6 relative z-10">
          {/* Chapter Title (only show on first page) */}
          {currentPageInChapter === 0 && (
            <h2 className="text-2xl font-bold text-foreground mb-8">
              {currentChapter.title}
            </h2>
          )}

          {/* Current Page Paragraphs */}
          {currentPageParagraphs.map((paragraph, index) => (
            <div key={paragraph.id} className="mb-6">
              {renderParagraphWithHighlight(paragraph, index)}

              {settings.showTranslation && paragraph.translation && (
                <div className="mt-4 p-4 bg-primary/5 rounded-xl border border-primary/20">
                  <p className="text-foreground leading-relaxed">
                    {paragraph.translation}
                  </p>
                </div>
              )}
            </div>
          ))}

          {/* Page indicator at bottom */}
          <div className="text-center py-4 text-sm text-muted-foreground border-t border-border">
            Page {currentPageInChapter + 1} of {totalPagesInChapter}
          </div>
        </div>
      </div>

      {/* Audio Controls */}
      <div className="border-t border-border p-4 bg-card">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleStop}
              disabled={!isPlaying}
              className="rounded-full"
            >
              <Volume2 className="h-5 w-5" />
            </Button>

            <Button
              variant="default"
              size="icon"
              onClick={handlePlayPause}
              className="h-12 w-12 rounded-full"
            >
              {isPlaying && !isPaused ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5 ml-0.5" />
              )}
            </Button>

            {isPlaying && (
              <div className="text-xs text-muted-foreground">
                {isPaused ? 'Paused' : 'Playing...'}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={goToPrevPage}
              disabled={currentChapterIndex === 0 && currentPageInChapter === 0}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            <div className="text-center">
              <div className="text-sm font-medium text-foreground">
                {currentGlobalPage} / {totalPages}
              </div>
              <div className="text-xs text-muted-foreground">
                {Math.round(progress)}% complete
              </div>
            </div>

            <Button
              variant="ghost"
              onClick={goToNextPage}
              disabled={
                currentChapterIndex === chapters.length - 1 &&
                currentPageInChapter === totalPagesInChapter - 1
              }
              className="flex items-center gap-2"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookReader;
