// IndexedDB utility for storing large book data
// localStorage has ~5-10MB limit, IndexedDB can store 100s of MB
import { Book } from '@/types/book';

const DB_NAME = 'ReadAndTranslateDB';
const DB_VERSION = 1;
const BOOKS_STORE = 'books';

// Initialize IndexedDB
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('[IndexedDB] Error opening database:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      console.log('[IndexedDB] Database opened successfully');
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      console.log('[IndexedDB] Database upgrade needed, creating object stores...');
      const db = (event.target as IDBOpenDBRequest).result;

      // Create books object store if it doesn't exist
      if (!db.objectStoreNames.contains(BOOKS_STORE)) {
        const objectStore = db.createObjectStore(BOOKS_STORE, { keyPath: 'id' });
        objectStore.createIndex('title', 'title', { unique: false });
        objectStore.createIndex('author', 'author', { unique: false });
        console.log('[IndexedDB] Created books object store');
      }
    };
  });
};

// Save a book to IndexedDB
export const saveBookToDB = async (book: Book): Promise<void> => {
  try {
    const db = await openDB();
    const transaction = db.transaction([BOOKS_STORE], 'readwrite');
    const objectStore = transaction.objectStore(BOOKS_STORE);

    return new Promise((resolve, reject) => {
      const request = objectStore.put(book);

      request.onsuccess = () => {
        console.log('[IndexedDB] ✓ Saved book:', book.title);
        resolve();
      };

      request.onerror = () => {
        console.error('[IndexedDB] ✗ Error saving book:', request.error);
        reject(request.error);
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('[IndexedDB] Failed to save book:', error);
    throw error;
  }
};

// Get a single book by ID
export const getBookFromDB = async (bookId: string): Promise<Book | null> => {
  try {
    const db = await openDB();
    const transaction = db.transaction([BOOKS_STORE], 'readonly');
    const objectStore = transaction.objectStore(BOOKS_STORE);

    return new Promise((resolve, reject) => {
      const request = objectStore.get(bookId);

      request.onsuccess = () => {
        const book = request.result as Book | undefined;
        if (book) {
          console.log('[IndexedDB] ✓ Found book:', book.title);
        } else {
          console.log('[IndexedDB] Book not found:', bookId);
        }
        resolve(book || null);
      };

      request.onerror = () => {
        console.error('[IndexedDB] ✗ Error getting book:', request.error);
        reject(request.error);
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('[IndexedDB] Failed to get book:', error);
    return null;
  }
};

// Get all books
export const getAllBooksFromDB = async (): Promise<Book[]> => {
  try {
    const db = await openDB();
    const transaction = db.transaction([BOOKS_STORE], 'readonly');
    const objectStore = transaction.objectStore(BOOKS_STORE);

    return new Promise((resolve, reject) => {
      const request = objectStore.getAll();

      request.onsuccess = () => {
        const books = request.result as Book[];
        console.log('[IndexedDB] ✓ Loaded', books.length, 'books');
        resolve(books);
      };

      request.onerror = () => {
        console.error('[IndexedDB] ✗ Error getting all books:', request.error);
        reject(request.error);
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('[IndexedDB] Failed to get all books:', error);
    return [];
  }
};

// Delete a book by ID
export const deleteBookFromDB = async (bookId: string): Promise<void> => {
  try {
    const db = await openDB();
    const transaction = db.transaction([BOOKS_STORE], 'readwrite');
    const objectStore = transaction.objectStore(BOOKS_STORE);

    return new Promise((resolve, reject) => {
      const request = objectStore.delete(bookId);

      request.onsuccess = () => {
        console.log('[IndexedDB] ✓ Deleted book:', bookId);
        resolve();
      };

      request.onerror = () => {
        console.error('[IndexedDB] ✗ Error deleting book:', request.error);
        reject(request.error);
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('[IndexedDB] Failed to delete book:', error);
    throw error;
  }
};

// Clear all books
export const clearAllBooksFromDB = async (): Promise<void> => {
  try {
    const db = await openDB();
    const transaction = db.transaction([BOOKS_STORE], 'readwrite');
    const objectStore = transaction.objectStore(BOOKS_STORE);

    return new Promise((resolve, reject) => {
      const request = objectStore.clear();

      request.onsuccess = () => {
        console.log('[IndexedDB] ✓ Cleared all books');
        resolve();
      };

      request.onerror = () => {
        console.error('[IndexedDB] ✗ Error clearing books:', request.error);
        reject(request.error);
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('[IndexedDB] Failed to clear books:', error);
    throw error;
  }
};

// Get book count
export const getBookCountFromDB = async (): Promise<number> => {
  try {
    const db = await openDB();
    const transaction = db.transaction([BOOKS_STORE], 'readonly');
    const objectStore = transaction.objectStore(BOOKS_STORE);

    return new Promise((resolve, reject) => {
      const request = objectStore.count();

      request.onsuccess = () => {
        const count = request.result;
        console.log('[IndexedDB] Book count:', count);
        resolve(count);
      };

      request.onerror = () => {
        console.error('[IndexedDB] ✗ Error counting books:', request.error);
        reject(request.error);
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('[IndexedDB] Failed to count books:', error);
    return 0;
  }
};

// Migrate books from localStorage to IndexedDB
export const migrateFromLocalStorage = async (): Promise<number> => {
  try {
    console.log('[IndexedDB] Starting migration from localStorage...');

    // Check if already migrated
    const migrated = localStorage.getItem('indexeddb_migrated');
    if (migrated === 'true') {
      console.log('[IndexedDB] Already migrated, skipping');
      return 0;
    }

    // Get books from localStorage
    const stored = localStorage.getItem('uploadedBooks');
    if (!stored) {
      console.log('[IndexedDB] No books in localStorage to migrate');
      localStorage.setItem('indexeddb_migrated', 'true');
      return 0;
    }

    const books = JSON.parse(stored) as Book[];
    console.log('[IndexedDB] Found', books.length, 'books in localStorage');

    // Save each book to IndexedDB
    let migratedCount = 0;
    for (const book of books) {
      try {
        await saveBookToDB(book);
        migratedCount++;
      } catch (error) {
        console.error('[IndexedDB] Failed to migrate book:', book.title, error);
      }
    }

    // Mark as migrated
    localStorage.setItem('indexeddb_migrated', 'true');

    // Clear books from localStorage to free space
    localStorage.removeItem('uploadedBooks');
    console.log('[IndexedDB] ✓ Migration complete:', migratedCount, 'books migrated');

    return migratedCount;
  } catch (error) {
    console.error('[IndexedDB] Migration failed:', error);
    return 0;
  }
};
