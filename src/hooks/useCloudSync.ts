import { useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import * as localStorage from '@/lib/storage';
import * as bookStorage from '@/lib/bookStorage';

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
      const books = await bookStorage.getUploadedBooks();
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

      console.log('[CloudSync] Starting download from cloud...');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      console.log('[CloudSync] User authenticated:', user.id);

      // Download books metadata first (without chapters to avoid 500 error)
      console.log('[CloudSync] Fetching books metadata...');
      const { data: booksMetadata, error: metadataError } = await supabase
        .from('books')
        .select('id, title, author, cover_url, uploaded_at, updated_at')
        .eq('user_id', user.id);

      if (metadataError) {
        console.error('[CloudSync] Error fetching books metadata:', {
          message: metadataError.message,
          details: metadataError.details,
          hint: metadataError.hint,
          code: metadataError.code,
        });
        throw new Error(`Failed to fetch books: ${metadataError.message}`);
      }

      console.log('[CloudSync] Downloaded', booksMetadata?.length || 0, 'books metadata');

      // Now fetch chapters one by one
      const booksData = [];
      if (booksMetadata && booksMetadata.length > 0) {
        console.log(`[CloudSync] Fetching chapters for ${booksMetadata.length} books...`);
        for (let i = 0; i < booksMetadata.length; i++) {
          const meta = booksMetadata[i];
          console.log(`[CloudSync] [${i + 1}/${booksMetadata.length}] Fetching chapters for: ${meta.title}`);

          const { data: bookWithChapters, error: chapterError } = await supabase
            .from('books')
            .select('chapters')
            .eq('id', meta.id)
            .single();

          if (chapterError) {
            console.error(`[CloudSync] ✗ Error fetching chapters for ${meta.title}:`, {
              message: chapterError.message,
              code: chapterError.code,
              details: chapterError.details
            });
            // Still add the book but with empty chapters
            booksData.push({
              ...meta,
              chapters: []
            });
            continue;
          }

          const chaptersCount = Array.isArray(bookWithChapters?.chapters) ? bookWithChapters.chapters.length : 0;
          console.log(`[CloudSync] ✓ [${i + 1}/${booksMetadata.length}] Got ${chaptersCount} chapters for: ${meta.title}`);

          booksData.push({
            ...meta,
            chapters: bookWithChapters?.chapters || []
          });

          setProgress(25 + ((i + 1) / booksMetadata.length) * 20); // 25-45%
        }
      }

      console.log('[CloudSync] Successfully downloaded', booksData.length, 'complete books');
      setProgress(45);

      // Download reading progress
      const { data: progressData, error: progressError } = await supabase
        .from('reading_progress')
        .select('*')
        .eq('user_id', user.id);

      if (progressError) {
        console.error('[CloudSync] Error fetching progress:', progressError);
      }

      console.log('[CloudSync] Downloaded reading progress:', progressData?.length || 0);
      setProgress(60);

      // Download favorites
      const { data: favoritesData, error: favoritesError } = await supabase
        .from('favorites')
        .select('book_id')
        .eq('user_id', user.id);

      if (favoritesError) {
        console.error('[CloudSync] Error fetching favorites:', favoritesError);
      }

      console.log('[CloudSync] Downloaded favorites:', favoritesData?.length || 0);
      setProgress(80);

      // Download user settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (settingsError && settingsError.code !== 'PGRST116') {
        console.error('[CloudSync] Error fetching settings:', settingsError);
      }

      setProgress(90);

      // Save to localStorage
      console.log('[CloudSync] Saving', booksData.length, 'books to localStorage...');
      let savedCount = 0;
      if (booksData && booksData.length > 0) {
        for (let i = 0; i < booksData.length; i++) {
          const book = booksData[i];
          console.log(`[CloudSync] [${i + 1}/${booksData.length}] Saving book:`, book.title);
          try {
            const bookToSave = {
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
              chapters: book.chapters || [],
            };
            console.log(`[CloudSync] Book ${book.title} has ${bookToSave.chapters?.length || 0} chapters`);
            await bookStorage.saveUploadedBook(bookToSave);
            savedCount++;
            console.log(`[CloudSync] ✓ [${savedCount}/${booksData.length}] Saved:`, book.title);
          } catch (saveError) {
            console.error(`[CloudSync] ✗ Failed to save book ${book.title}:`, saveError);
          }
        }
      } else {
        console.log('[CloudSync] No books to save');
      }
      console.log(`[CloudSync] Saved ${savedCount} out of ${booksData.length} books to localStorage`);

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
      const [booksResult, progressResult, favoritesResult, localBooks] = await Promise.all([
        supabase.from('books').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('reading_progress').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('favorites').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        bookStorage.getUploadedBooks(),
      ]);

      return {
        configured: true,
        authenticated: true,
        cloudBooks: booksResult.count || 0,
        cloudProgress: progressResult.count || 0,
        cloudFavorites: favoritesResult.count || 0,
        localBooks: localBooks.length,
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
