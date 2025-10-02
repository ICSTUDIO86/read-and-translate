// Cleanup utility to remove duplicate books from both cloud and local storage
import { supabase, isSupabaseConfigured } from './supabaseClient';
import * as bookStorage from './bookStorage';

interface DuplicateGroup {
  title: string;
  books: Array<{
    id: string;
    title: string;
    author: string;
    uploaded_at?: string;
  }>;
}

export const findDuplicateBooks = async (): Promise<DuplicateGroup[]> => {
  if (!isSupabaseConfigured()) {
    console.log('[Cleanup] Supabase not configured');
    return [];
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('[Cleanup] Not authenticated');
      return [];
    }

    // Get all books from cloud
    const { data: books, error } = await supabase
      .from('books')
      .select('id, title, author, uploaded_at')
      .eq('user_id', user.id)
      .order('uploaded_at', { ascending: false });

    if (error) throw error;

    // Group by title
    const groupedByTitle = new Map<string, Array<any>>();

    books?.forEach(book => {
      const existing = groupedByTitle.get(book.title) || [];
      existing.push(book);
      groupedByTitle.set(book.title, existing);
    });

    // Find duplicates (titles with more than 1 book)
    const duplicates: DuplicateGroup[] = [];
    groupedByTitle.forEach((books, title) => {
      if (books.length > 1) {
        duplicates.push({ title, books });
      }
    });

    console.log('[Cleanup] Found', duplicates.length, 'duplicate groups');
    duplicates.forEach(group => {
      console.log(`[Cleanup] - "${group.title}": ${group.books.length} copies`);
    });

    return duplicates;
  } catch (error) {
    console.error('[Cleanup] Failed to find duplicates:', error);
    return [];
  }
};

export const removeDuplicateBooks = async (): Promise<{ removed: number; kept: number }> => {
  const duplicates = await findDuplicateBooks();

  if (duplicates.length === 0) {
    console.log('[Cleanup] No duplicates found');
    return { removed: 0, kept: 0 };
  }

  let removed = 0;
  let kept = 0;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    for (const group of duplicates) {
      // Keep the newest one (first in array, sorted by uploaded_at DESC)
      const toKeep = group.books[0];
      const toRemove = group.books.slice(1);

      console.log(`[Cleanup] Keeping "${group.title}" (id: ${toKeep.id})`);
      kept++;

      // Remove the rest from both cloud and IndexedDB
      for (const book of toRemove) {
        console.log(`[Cleanup] Removing duplicate "${group.title}" (id: ${book.id})`);

        // Delete from cloud
        const { error: cloudError } = await supabase
          .from('books')
          .delete()
          .eq('id', book.id)
          .eq('user_id', user.id);

        if (cloudError) {
          console.error(`[Cleanup] Failed to delete from cloud:`, cloudError);
        } else {
          console.log(`[Cleanup] ✓ Deleted from cloud: ${book.id}`);
        }

        // Delete from IndexedDB
        try {
          await bookStorage.deleteUploadedBook(book.id);
          console.log(`[Cleanup] ✓ Deleted from IndexedDB: ${book.id}`);
        } catch (dbError) {
          console.error(`[Cleanup] Failed to delete from IndexedDB:`, dbError);
        }

        removed++;
      }
    }

    console.log(`[Cleanup] ✓ Cleanup complete: kept ${kept}, removed ${removed}`);
    return { removed, kept };
  } catch (error) {
    console.error('[Cleanup] Failed to remove duplicates:', error);
    throw error;
  }
};
