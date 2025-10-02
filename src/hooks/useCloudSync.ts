import { useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import * as localStorage from '@/lib/storage';

export const useCloudSync = () => {
  const [syncing, setSyncing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const uploadLocalDataToCloud = async () => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured');
    }

    try {
      setSyncing(true);
      setProgress(0);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get all local data
      const books = localStorage.getUploadedBooks();
      const readingProgress = localStorage.getAllReadingProgress();
      const favorites = localStorage.getFavorites();
      const readerSettings = localStorage.getReaderSettings();
      const readingStats = localStorage.getReadingStats();

      const totalSteps = books.length + readingProgress.length + favorites.length + 2;
      let currentStep = 0;

      // Upload books
      for (const book of books) {
        await supabase.from('books').upsert({
          id: book.id,
          user_id: user.id,
          title: book.title,
          author: book.author || null,
          cover_url: book.cover || null,
          chapters: book.chapters,
        }, { onConflict: 'id' });

        currentStep++;
        setProgress((currentStep / totalSteps) * 100);
      }

      // Upload reading progress
      for (const progress of readingProgress) {
        await supabase.from('reading_progress').upsert({
          user_id: user.id,
          book_id: progress.bookId,
          current_chapter: progress.currentChapter,
          current_paragraph: progress.currentParagraph,
          last_read: progress.lastRead,
        }, { onConflict: 'user_id,book_id' });

        currentStep++;
        setProgress((currentStep / totalSteps) * 100);
      }

      // Upload favorites
      for (const bookId of favorites) {
        try {
          await supabase.from('favorites').insert({
            user_id: user.id,
            book_id: bookId,
          });
        } catch (err: any) {
          // Ignore duplicate errors
          if (err.code !== '23505') throw err;
        }

        currentStep++;
        setProgress((currentStep / totalSteps) * 100);
      }

      // Upload user settings
      if (readerSettings || readingStats) {
        await supabase.from('user_settings').upsert({
          user_id: user.id,
          reader_settings: readerSettings || undefined,
          reading_stats: readingStats,
        }, { onConflict: 'user_id' });

        currentStep++;
        setProgress((currentStep / totalSteps) * 100);
      }

      // Get TTS configuration
      const ttsConfigStr = window.localStorage.getItem('tts_configuration');
      if (ttsConfigStr) {
        const ttsConfig = JSON.parse(ttsConfigStr);
        await supabase.from('user_settings').upsert({
          user_id: user.id,
          tts_configuration: ttsConfig,
        }, { onConflict: 'user_id' });
      }

      currentStep++;
      setProgress(100);

      return {
        booksUploaded: books.length,
        progressUploaded: readingProgress.length,
        favoritesUploaded: favorites.length,
      };
    } catch (err) {
      console.error('Failed to upload data to cloud:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload data');
      throw err;
    } finally {
      setSyncing(false);
    }
  };

  const downloadCloudDataToLocal = async () => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured');
    }

    try {
      setSyncing(true);
      setProgress(0);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Download books
      const { data: booksData } = await supabase
        .from('books')
        .select('*')
        .eq('user_id', user.id);

      setProgress(25);

      // Download reading progress
      const { data: progressData } = await supabase
        .from('reading_progress')
        .select('*')
        .eq('user_id', user.id);

      setProgress(50);

      // Download favorites
      const { data: favoritesData } = await supabase
        .from('favorites')
        .select('book_id')
        .eq('user_id', user.id);

      setProgress(75);

      // Download user settings
      const { data: settingsData } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // Save to localStorage
      if (booksData) {
        booksData.forEach(book => {
          localStorage.saveUploadedBook({
            id: book.id,
            title: book.title,
            author: book.author || 'Unknown',
            cover: book.cover_url || `https://via.placeholder.com/400x600/f59e0b/ffffff?text=${encodeURIComponent(book.title.substring(0, 20))}`,
            rating: 0,
            pages: 0,
            language: 'English',
            audioLength: '0h0m',
            genre: 'Uploaded',
            synopsis: '',
            isFree: true,
            chapters: book.chapters,
          });
        });
      }

      if (progressData) {
        progressData.forEach(p => {
          localStorage.saveReadingProgress({
            bookId: p.book_id,
            currentChapter: p.current_chapter,
            currentParagraph: p.current_paragraph,
            lastRead: p.last_read,
          });
        });
      }

      if (favoritesData) {
        favoritesData.forEach(f => {
          localStorage.addFavorite(f.book_id);
        });
      }

      if (settingsData) {
        if (settingsData.reader_settings) {
          localStorage.saveReaderSettings(settingsData.reader_settings);
        }
        if (settingsData.tts_configuration) {
          window.localStorage.setItem('tts_configuration', JSON.stringify(settingsData.tts_configuration));
        }
      }

      setProgress(100);

      return {
        booksDownloaded: booksData?.length || 0,
        progressDownloaded: progressData?.length || 0,
        favoritesDownloaded: favoritesData?.length || 0,
      };
    } catch (err) {
      console.error('Failed to download data from cloud:', err);
      setError(err instanceof Error ? err.message : 'Failed to download data');
      throw err;
    } finally {
      setSyncing(false);
    }
  };

  const checkCloudStatus = async () => {
    if (!isSupabaseConfigured()) {
      return { configured: false };
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { configured: true, authenticated: false };
      }

      // Check how many items are in the cloud
      const [booksResult, progressResult, favoritesResult] = await Promise.all([
        supabase.from('books').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('reading_progress').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('favorites').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      ]);

      return {
        configured: true,
        authenticated: true,
        cloudBooks: booksResult.count || 0,
        cloudProgress: progressResult.count || 0,
        cloudFavorites: favoritesResult.count || 0,
        localBooks: localStorage.getUploadedBooks().length,
        localProgress: localStorage.getAllReadingProgress().length,
        localFavorites: localStorage.getFavorites().length,
      };
    } catch (err) {
      console.error('Failed to check cloud status:', err);
      return { configured: true, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  };

  return {
    syncing,
    progress,
    error,
    uploadLocalDataToCloud,
    downloadCloudDataToLocal,
    checkCloudStatus,
  };
};
