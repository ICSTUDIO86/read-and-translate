// Supabase cloud storage layer - provides same API as localStorage storage
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { Book } from '@/types/book';
import * as localStorage from './storage';

// Timeout helper to prevent long waits
const withTimeout = <T>(promise: Promise<T>, timeoutMs: number = 3000): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
    )
  ]);
};

// Reading Progress
interface ReadingProgress {
  bookId: string;
  currentChapter: number;
  currentParagraph: number;
  lastRead: string;
}

export const saveReadingProgress = async (progress: ReadingProgress): Promise<void> => {
  // Always save to localStorage first for reliability
  localStorage.saveReadingProgress(progress);
  console.log('[Storage] Saved reading progress to localStorage:', progress);

  if (!isSupabaseConfigured()) {
    console.log('[Storage] Supabase not configured, using localStorage only');
    return;
  }

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.log('[Storage] User not authenticated, using localStorage only');
      return; // Return early, don't throw error
    }

    const { error } = await supabase
      .from('reading_progress')
      .upsert({
        user_id: user.id,
        book_id: progress.bookId,
        current_chapter: progress.currentChapter,
        current_paragraph: progress.currentParagraph,
        last_read: progress.lastRead,
      }, {
        onConflict: 'user_id,book_id'
      });

    if (error) {
      console.warn('[Storage] Failed to save to Supabase, but localStorage is updated:', error);
    } else {
      console.log('[Storage] Successfully saved to both localStorage and Supabase');
    }
  } catch (error) {
    console.warn('[Storage] Supabase save error (localStorage is already updated):', error);
  }
};

export const getReadingProgress = async (bookId: string): Promise<ReadingProgress | null> => {
  // Try localStorage first for faster load
  const localProgress = localStorage.getReadingProgress(bookId);
  console.log('[Storage] Retrieved progress from localStorage:', localProgress);

  if (!isSupabaseConfigured()) {
    console.log('[Storage] Supabase not configured, using localStorage only');
    return localProgress;
  }

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.log('[Storage] User not authenticated, using localStorage');
      return localProgress;
    }

    const { data, error } = await supabase
      .from('reading_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('book_id', bookId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.warn('[Storage] Supabase read error, using localStorage:', error);
      return localProgress;
    }

    if (data) {
      const cloudProgress = {
        bookId: data.book_id,
        currentChapter: data.current_chapter,
        currentParagraph: data.current_paragraph,
        lastRead: data.last_read,
      };
      console.log('[Storage] Retrieved progress from Supabase:', cloudProgress);

      // Return the most recent progress
      if (!localProgress || new Date(cloudProgress.lastRead) > new Date(localProgress.lastRead)) {
        return cloudProgress;
      }
    }

    return localProgress;
  } catch (error) {
    console.warn('[Storage] Failed to get reading progress from cloud:', error);
    return localProgress;
  }
};

export const getAllReadingProgress = async (): Promise<ReadingProgress[]> => {
  // Always try localStorage first for instant response
  const localProgress = localStorage.getAllReadingProgress();

  // If Supabase not configured, return local progress immediately
  if (!isSupabaseConfigured()) {
    return localProgress;
  }

  try {
    // Use timeout to prevent long waits
    const { data: { user } } = await withTimeout(supabase.auth.getUser(), 2000);
    if (!user) {
      console.log('[Storage] Not authenticated, using localStorage for progress');
      return localProgress;
    }

    const { data, error } = await withTimeout(
      supabase
        .from('reading_progress')
        .select('*')
        .eq('user_id', user.id),
      3000
    );

    if (error) throw error;

    const cloudProgress = (data || []).map(item => ({
      bookId: item.book_id,
      currentChapter: item.current_chapter,
      currentParagraph: item.current_paragraph,
      lastRead: item.last_read,
    }));

    console.log('[Storage] Loaded reading progress from cloud:', cloudProgress.length);
    return cloudProgress;
  } catch (error) {
    console.warn('[Storage] Failed to get reading progress from cloud, using localStorage:', error);
    return localProgress;
  }
};

// Uploaded Books
export const saveUploadedBook = async (book: Book): Promise<void> => {
  if (!isSupabaseConfigured()) {
    return localStorage.saveUploadedBook(book);
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('books')
      .upsert({
        id: book.id,
        user_id: user.id,
        title: book.title,
        author: book.author || null,
        cover_url: book.cover || null,
        chapters: book.chapters,
      }, {
        onConflict: 'id'
      });

    if (error) throw error;

    // Also save to localStorage as backup
    localStorage.saveUploadedBook(book);
  } catch (error) {
    console.error('Failed to save book to cloud:', error);
    // Fallback to localStorage
    localStorage.saveUploadedBook(book);
  }
};

export const saveBook = saveUploadedBook; // Alias

export const getUploadedBooks = async (): Promise<Book[]> => {
  // Always try localStorage first for instant response
  const localBooks = localStorage.getUploadedBooks();
  console.log('[Storage] getUploadedBooks - localStorage has:', localBooks.length, 'books');

  // If Supabase not configured, return local books immediately
  if (!isSupabaseConfigured()) {
    console.log('[Storage] Supabase not configured, returning localStorage books');
    return localBooks;
  }

  try {
    // Use timeout to prevent long waits (3 seconds max)
    const { data: { user } } = await withTimeout(supabase.auth.getUser(), 2000);
    if (!user) {
      console.log('[Storage] Not authenticated, using localStorage with', localBooks.length, 'books');
      return localBooks;
    }

    console.log('[Storage] Authenticated, fetching from Supabase...');
    const { data, error } = await withTimeout(
      supabase
        .from('books')
        .select('*')
        .eq('user_id', user.id)
        .order('uploaded_at', { ascending: false }),
      3000
    );

    if (error) throw error;

    const cloudBooks = (data || []).map(item => ({
      id: item.id,
      title: item.title,
      author: item.author || 'Unknown',
      cover: item.cover_url && item.cover_url.trim() !== '' ? item.cover_url : `https://via.placeholder.com/400x600/f59e0b/ffffff?text=${encodeURIComponent(item.title.substring(0, 20))}`,
      rating: 0,
      pages: 0,
      language: 'English',
      audioLength: '0h0m',
      genre: 'Uploaded',
      synopsis: '',
      isFree: true,
      chapters: item.chapters,
    }));

    console.log('[Storage] ✓ Loaded', cloudBooks.length, 'books from Supabase');

    // If cloud has books but localStorage doesn't, save to localStorage
    if (cloudBooks.length > 0 && localBooks.length === 0) {
      console.log('[Storage] Syncing cloud books to localStorage');
      cloudBooks.forEach(book => localStorage.saveUploadedBook(book));
    }

    return cloudBooks;
  } catch (error) {
    console.warn('[Storage] ✗ Failed to get books from Supabase, using localStorage with', localBooks.length, 'books:', error);
    return localBooks;
  }
};

export const deleteUploadedBook = async (bookId: string): Promise<void> => {
  if (!isSupabaseConfigured()) {
    return localStorage.deleteUploadedBook(bookId);
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('books')
      .delete()
      .eq('id', bookId)
      .eq('user_id', user.id);

    if (error) throw error;

    // Also delete from localStorage
    localStorage.deleteUploadedBook(bookId);
  } catch (error) {
    console.error('Failed to delete book from cloud:', error);
    // Fallback to localStorage
    localStorage.deleteUploadedBook(bookId);
  }
};

// Favorites
export const addFavorite = async (bookId: string): Promise<void> => {
  if (!isSupabaseConfigured()) {
    return localStorage.addFavorite(bookId);
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('favorites')
      .insert({
        user_id: user.id,
        book_id: bookId,
      });

    if (error && error.code !== '23505') throw error; // 23505 = unique violation (already exists)

    // Also save to localStorage
    localStorage.addFavorite(bookId);
  } catch (error) {
    console.error('Failed to add favorite to cloud:', error);
    localStorage.addFavorite(bookId);
  }
};

export const removeFavorite = async (bookId: string): Promise<void> => {
  if (!isSupabaseConfigured()) {
    return localStorage.removeFavorite(bookId);
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('book_id', bookId);

    if (error) throw error;

    // Also remove from localStorage
    localStorage.removeFavorite(bookId);
  } catch (error) {
    console.error('Failed to remove favorite from cloud:', error);
    localStorage.removeFavorite(bookId);
  }
};

export const isFavorite = async (bookId: string): Promise<boolean> => {
  if (!isSupabaseConfigured()) {
    return localStorage.isFavorite(bookId);
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('book_id', bookId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return !!data;
  } catch (error) {
    console.error('Failed to check favorite in cloud:', error);
    return localStorage.isFavorite(bookId);
  }
};

export const getFavorites = async (): Promise<string[]> => {
  if (!isSupabaseConfigured()) {
    return localStorage.getFavorites();
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('favorites')
      .select('book_id')
      .eq('user_id', user.id);

    if (error) throw error;

    return (data || []).map(item => item.book_id);
  } catch (error) {
    console.error('Failed to get favorites from cloud:', error);
    return localStorage.getFavorites();
  }
};

// Reader Settings
interface ReaderSettings {
  fontSize: number;
  lineHeight: number;
  fontFamily: string;
  showTranslation: boolean;
}

export const saveReaderSettings = async (settings: ReaderSettings): Promise<void> => {
  if (!isSupabaseConfigured()) {
    return localStorage.saveReaderSettings(settings);
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: user.id,
        reader_settings: settings,
      }, {
        onConflict: 'user_id'
      });

    if (error) throw error;

    // Also save to localStorage
    localStorage.saveReaderSettings(settings);
  } catch (error) {
    console.error('Failed to save reader settings to cloud:', error);
    localStorage.saveReaderSettings(settings);
  }
};

export const getReaderSettings = async (): Promise<ReaderSettings | null> => {
  if (!isSupabaseConfigured()) {
    return localStorage.getReaderSettings();
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('user_settings')
      .select('reader_settings')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return data?.reader_settings || null;
  } catch (error) {
    console.error('Failed to get reader settings from cloud:', error);
    return localStorage.getReaderSettings();
  }
};

// Reading Stats
interface ReadingStats {
  totalBooksRead: number;
  totalTimeRead: number;
  booksCompleted: string[];
  currentStreak: number;
  lastReadDate: string;
}

export const updateReadingStats = async (bookId: string, timeRead: number): Promise<void> => {
  if (!isSupabaseConfigured()) {
    return localStorage.updateReadingStats(bookId, timeRead);
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get current stats
    const { data: currentData } = await supabase
      .from('user_settings')
      .select('reading_stats')
      .eq('user_id', user.id)
      .single();

    const currentStats = currentData?.reading_stats || {
      totalBooksRead: 0,
      totalTimeRead: 0,
      booksCompleted: [],
      currentStreak: 0,
      lastReadDate: new Date().toISOString(),
    };

    // Update stats
    currentStats.totalTimeRead += timeRead;
    const now = new Date().toISOString();
    currentStats.lastReadDate = now;

    // Update streak logic (simplified)
    const lastRead = new Date(currentStats.lastReadDate);
    const today = new Date();
    const diffDays = Math.floor((today.getTime() - lastRead.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      // Same day
    } else if (diffDays === 1) {
      currentStats.currentStreak += 1;
    } else {
      currentStats.currentStreak = 1;
    }

    const { error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: user.id,
        reading_stats: currentStats,
      }, {
        onConflict: 'user_id'
      });

    if (error) throw error;

    // Also update localStorage
    localStorage.updateReadingStats(bookId, timeRead);
  } catch (error) {
    console.error('Failed to update reading stats in cloud:', error);
    localStorage.updateReadingStats(bookId, timeRead);
  }
};

export const markBookCompleted = async (bookId: string): Promise<void> => {
  if (!isSupabaseConfigured()) {
    return localStorage.markBookCompleted(bookId);
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get current stats
    const { data: currentData } = await supabase
      .from('user_settings')
      .select('reading_stats')
      .eq('user_id', user.id)
      .single();

    const currentStats = currentData?.reading_stats || {
      totalBooksRead: 0,
      totalTimeRead: 0,
      booksCompleted: [],
      currentStreak: 0,
      lastReadDate: new Date().toISOString(),
    };

    if (!currentStats.booksCompleted.includes(bookId)) {
      currentStats.booksCompleted.push(bookId);
      currentStats.totalBooksRead += 1;

      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          reading_stats: currentStats,
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;
    }

    // Also update localStorage
    localStorage.markBookCompleted(bookId);
  } catch (error) {
    console.error('Failed to mark book completed in cloud:', error);
    localStorage.markBookCompleted(bookId);
  }
};

export const getReadingStats = async (): Promise<ReadingStats> => {
  if (!isSupabaseConfigured()) {
    return localStorage.getReadingStats();
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('user_settings')
      .select('reading_stats')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return data?.reading_stats || {
      totalBooksRead: 0,
      totalTimeRead: 0,
      booksCompleted: [],
      currentStreak: 0,
      lastReadDate: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Failed to get reading stats from cloud:', error);
    return localStorage.getReadingStats();
  }
};

// Clear all data
export const clearAllData = async (): Promise<void> => {
  if (!isSupabaseConfigured()) {
    return localStorage.clearAllData();
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Delete all user data
    await Promise.all([
      supabase.from('books').delete().eq('user_id', user.id),
      supabase.from('reading_progress').delete().eq('user_id', user.id),
      supabase.from('favorites').delete().eq('user_id', user.id),
      supabase.from('user_settings').delete().eq('user_id', user.id),
    ]);

    // Also clear localStorage
    localStorage.clearAllData();
  } catch (error) {
    console.error('Failed to clear data from cloud:', error);
    localStorage.clearAllData();
  }
};

// Export all existing localStorage functions for compatibility
export * from './storage';
