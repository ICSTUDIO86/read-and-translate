// LocalStorage utility for managing book reading progress and settings
import { Book } from '@/types/book';

interface ReadingProgress {
  bookId: string;
  currentChapter: number;
  currentParagraph: number;
  lastRead: string;
}

interface ReaderSettings {
  fontSize: number;
  lineHeight: number;
  fontFamily: string;
  showTranslation: boolean;
}

const STORAGE_KEYS = {
  READING_PROGRESS: 'readingProgress',
  READER_SETTINGS: 'readerSettings',
  FAVORITES: 'favorites',
  READING_STATS: 'readingStats',
  UPLOADED_BOOKS: 'uploadedBooks',
};

// Reading Progress
export const saveReadingProgress = (progress: ReadingProgress): void => {
  try {
    const allProgress = getAllReadingProgress();
    const existingIndex = allProgress.findIndex(p => p.bookId === progress.bookId);

    if (existingIndex >= 0) {
      allProgress[existingIndex] = progress;
    } else {
      allProgress.push(progress);
    }

    localStorage.setItem(STORAGE_KEYS.READING_PROGRESS, JSON.stringify(allProgress));
  } catch (error) {
    console.error('Failed to save reading progress:', error);
  }
};

export const getReadingProgress = (bookId: string): ReadingProgress | null => {
  try {
    const allProgress = getAllReadingProgress();
    return allProgress.find(p => p.bookId === bookId) || null;
  } catch (error) {
    console.error('Failed to get reading progress:', error);
    return null;
  }
};

export const getAllReadingProgress = (): ReadingProgress[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.READING_PROGRESS);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to get all reading progress:', error);
    return [];
  }
};

// Reader Settings
export const saveReaderSettings = (settings: ReaderSettings): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.READER_SETTINGS, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save reader settings:', error);
  }
};

export const getReaderSettings = (): ReaderSettings | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.READER_SETTINGS);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Failed to get reader settings:', error);
    return null;
  }
};

// Favorites
export const addFavorite = (bookId: string): void => {
  try {
    const favorites = getFavorites();
    if (!favorites.includes(bookId)) {
      favorites.push(bookId);
      localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
    }
  } catch (error) {
    console.error('Failed to add favorite:', error);
  }
};

export const removeFavorite = (bookId: string): void => {
  try {
    const favorites = getFavorites();
    const filtered = favorites.filter(id => id !== bookId);
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to remove favorite:', error);
  }
};

export const isFavorite = (bookId: string): boolean => {
  try {
    const favorites = getFavorites();
    return favorites.includes(bookId);
  } catch (error) {
    console.error('Failed to check favorite:', error);
    return false;
  }
};

export const getFavorites = (): string[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.FAVORITES);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to get favorites:', error);
    return [];
  }
};

// Reading Stats
interface ReadingStats {
  totalBooksRead: number;
  totalTimeRead: number; // in minutes
  booksCompleted: string[];
  currentStreak: number;
  lastReadDate: string;
}

export const updateReadingStats = (bookId: string, timeRead: number): void => {
  try {
    const stats = getReadingStats();
    stats.totalTimeRead += timeRead;
    stats.lastReadDate = new Date().toISOString();

    // Update streak
    const lastRead = new Date(stats.lastReadDate);
    const today = new Date();
    const diffDays = Math.floor((today.getTime() - lastRead.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      // Same day, keep streak
    } else if (diffDays === 1) {
      // Consecutive day
      stats.currentStreak += 1;
    } else {
      // Streak broken
      stats.currentStreak = 1;
    }

    localStorage.setItem(STORAGE_KEYS.READING_STATS, JSON.stringify(stats));
  } catch (error) {
    console.error('Failed to update reading stats:', error);
  }
};

export const markBookCompleted = (bookId: string): void => {
  try {
    const stats = getReadingStats();
    if (!stats.booksCompleted.includes(bookId)) {
      stats.booksCompleted.push(bookId);
      stats.totalBooksRead += 1;
      localStorage.setItem(STORAGE_KEYS.READING_STATS, JSON.stringify(stats));
    }
  } catch (error) {
    console.error('Failed to mark book completed:', error);
  }
};

export const getReadingStats = (): ReadingStats => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.READING_STATS);
    return stored ? JSON.parse(stored) : {
      totalBooksRead: 0,
      totalTimeRead: 0,
      booksCompleted: [],
      currentStreak: 0,
      lastReadDate: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Failed to get reading stats:', error);
    return {
      totalBooksRead: 0,
      totalTimeRead: 0,
      booksCompleted: [],
      currentStreak: 0,
      lastReadDate: new Date().toISOString(),
    };
  }
};

// Uploaded Books
export const saveUploadedBook = (book: Book): void => {
  try {
    const books = getUploadedBooks();
    const existingIndex = books.findIndex(b => b.id === book.id);

    if (existingIndex >= 0) {
      books[existingIndex] = book;
    } else {
      books.push(book);
    }

    localStorage.setItem(STORAGE_KEYS.UPLOADED_BOOKS, JSON.stringify(books));
  } catch (error) {
    console.error('Failed to save uploaded book:', error);
  }
};

// Alias for saveUploadedBook
export const saveBook = saveUploadedBook;

export const getUploadedBooks = (): Book[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.UPLOADED_BOOKS);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to get uploaded books:', error);
    return [];
  }
};

export const deleteUploadedBook = (bookId: string): void => {
  try {
    const books = getUploadedBooks();
    const filtered = books.filter(b => b.id !== bookId);
    localStorage.setItem(STORAGE_KEYS.UPLOADED_BOOKS, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to delete uploaded book:', error);
  }
};

// Clear all data
export const clearAllData = (): void => {
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  } catch (error) {
    console.error('Failed to clear all data:', error);
  }
};

// Export all data as JSON
export interface AllDataExport {
  version: string;
  exportDate: string;
  books: Book[];
  readingProgress: ReadingProgress[];
  favorites: string[];
  readingStats: ReadingStats;
  readerSettings: ReaderSettings | null;
  ttsConfiguration: any; // From ttsConfig.ts
}

export const exportAllData = (): AllDataExport => {
  try {
    // Get TTS configuration from localStorage
    const ttsConfig = localStorage.getItem('tts_configuration');

    return {
      version: '1.0',
      exportDate: new Date().toISOString(),
      books: getUploadedBooks(),
      readingProgress: getAllReadingProgress(),
      favorites: getFavorites(),
      readingStats: getReadingStats(),
      readerSettings: getReaderSettings(),
      ttsConfiguration: ttsConfig ? JSON.parse(ttsConfig) : null,
    };
  } catch (error) {
    console.error('Failed to export all data:', error);
    throw error;
  }
};

// Import all data from JSON
export const importAllData = (data: AllDataExport, mergeMode: 'replace' | 'merge' = 'merge'): void => {
  try {
    if (mergeMode === 'replace') {
      // Clear existing data first
      clearAllData();
    }

    // Import books
    if (data.books && data.books.length > 0) {
      if (mergeMode === 'merge') {
        // Merge: keep existing books, add new ones
        const existingBooks = getUploadedBooks();
        const existingIds = new Set(existingBooks.map(b => b.id));

        data.books.forEach(book => {
          if (!existingIds.has(book.id)) {
            saveUploadedBook(book);
          }
        });
      } else {
        // Replace: set all books
        localStorage.setItem(STORAGE_KEYS.UPLOADED_BOOKS, JSON.stringify(data.books));
      }
    }

    // Import reading progress
    if (data.readingProgress && data.readingProgress.length > 0) {
      if (mergeMode === 'merge') {
        data.readingProgress.forEach(progress => {
          saveReadingProgress(progress);
        });
      } else {
        localStorage.setItem(STORAGE_KEYS.READING_PROGRESS, JSON.stringify(data.readingProgress));
      }
    }

    // Import favorites
    if (data.favorites && data.favorites.length > 0) {
      if (mergeMode === 'merge') {
        const existing = getFavorites();
        const merged = Array.from(new Set([...existing, ...data.favorites]));
        localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(merged));
      } else {
        localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(data.favorites));
      }
    }

    // Import reading stats
    if (data.readingStats) {
      if (mergeMode === 'merge') {
        const existing = getReadingStats();
        const merged = {
          totalBooksRead: existing.totalBooksRead + data.readingStats.totalBooksRead,
          totalTimeRead: existing.totalTimeRead + data.readingStats.totalTimeRead,
          booksCompleted: Array.from(new Set([...existing.booksCompleted, ...data.readingStats.booksCompleted])),
          currentStreak: Math.max(existing.currentStreak, data.readingStats.currentStreak),
          lastReadDate: data.readingStats.lastReadDate > existing.lastReadDate ? data.readingStats.lastReadDate : existing.lastReadDate,
        };
        localStorage.setItem(STORAGE_KEYS.READING_STATS, JSON.stringify(merged));
      } else {
        localStorage.setItem(STORAGE_KEYS.READING_STATS, JSON.stringify(data.readingStats));
      }
    }

    // Import reader settings
    if (data.readerSettings) {
      if (mergeMode === 'replace') {
        localStorage.setItem(STORAGE_KEYS.READER_SETTINGS, JSON.stringify(data.readerSettings));
      }
      // In merge mode, keep existing settings
    }

    // Import TTS configuration
    if (data.ttsConfiguration) {
      if (mergeMode === 'replace') {
        localStorage.setItem('tts_configuration', JSON.stringify(data.ttsConfiguration));
      }
      // In merge mode, keep existing TTS config
    }

  } catch (error) {
    console.error('Failed to import all data:', error);
    throw error;
  }
};

// Download all data as JSON file
export const downloadAllData = (): void => {
  try {
    const data = exportAllData();
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `read-and-translate-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to download all data:', error);
    throw error;
  }
};

// Import from file
export const importFromFile = async (file: File, mergeMode: 'replace' | 'merge' = 'merge'): Promise<void> => {
  try {
    const text = await file.text();
    const data = JSON.parse(text) as AllDataExport;

    // Validate data structure
    if (!data.version || !data.books) {
      throw new Error('Invalid backup file format');
    }

    importAllData(data, mergeMode);
  } catch (error) {
    console.error('Failed to import from file:', error);
    throw error;
  }
};
