// Book storage using IndexedDB (replaces localStorage for books)
// All other data (progress, settings) still use localStorage
import { Book } from '@/types/book';
import {
  saveBookToDB,
  getBookFromDB,
  getAllBooksFromDB,
  deleteBookFromDB,
  clearAllBooksFromDB,
  getBookCountFromDB,
  migrateFromLocalStorage,
} from './indexedDB';

// Save a book (async)
export const saveUploadedBook = async (book: Book): Promise<void> => {
  try {
    await saveBookToDB(book);
    console.log('[BookStorage] ✓ Saved book:', book.title);
  } catch (error) {
    console.error('[BookStorage] Failed to save book:', error);
    throw error;
  }
};

// Alias for saveUploadedBook
export const saveBook = saveUploadedBook;

// Get all uploaded books (async)
export const getUploadedBooks = async (): Promise<Book[]> => {
  try {
    const books = await getAllBooksFromDB();
    console.log('[BookStorage] Loaded', books.length, 'books from IndexedDB');
    return books;
  } catch (error) {
    console.error('[BookStorage] Failed to get books:', error);
    return [];
  }
};

// Get a single book by ID (async)
export const getBookById = async (bookId: string): Promise<Book | null> => {
  try {
    return await getBookFromDB(bookId);
  } catch (error) {
    console.error('[BookStorage] Failed to get book:', error);
    return null;
  }
};

// Delete a book (async)
export const deleteUploadedBook = async (bookId: string): Promise<void> => {
  try {
    await deleteBookFromDB(bookId);
    console.log('[BookStorage] ✓ Deleted book:', bookId);
  } catch (error) {
    console.error('[BookStorage] Failed to delete book:', error);
    throw error;
  }
};

// Clear all books (async)
export const clearAllBooks = async (): Promise<void> => {
  try {
    await clearAllBooksFromDB();
    console.log('[BookStorage] ✓ Cleared all books');
  } catch (error) {
    console.error('[BookStorage] Failed to clear books:', error);
    throw error;
  }
};

// Get book count (async)
export const getBookCount = async (): Promise<number> => {
  try {
    return await getBookCountFromDB();
  } catch (error) {
    console.error('[BookStorage] Failed to get book count:', error);
    return 0;
  }
};

// Initialize and migrate from localStorage if needed
export const initializeBookStorage = async (): Promise<void> => {
  try {
    console.log('[BookStorage] Initializing...');
    const migratedCount = await migrateFromLocalStorage();
    if (migratedCount > 0) {
      console.log('[BookStorage] ✓ Migrated', migratedCount, 'books from localStorage');
    }
    const count = await getBookCount();
    console.log('[BookStorage] ✓ Initialized with', count, 'books');
  } catch (error) {
    console.error('[BookStorage] Failed to initialize:', error);
  }
};
