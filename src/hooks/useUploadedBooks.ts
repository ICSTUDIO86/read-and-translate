import { useState, useEffect } from 'react';
import { getUploadedBooks } from '@/lib/supabaseStorage';

// Custom event for book updates
const BOOKS_UPDATED_EVENT = 'booksUpdated';

export const triggerBooksUpdate = () => {
  window.dispatchEvent(new CustomEvent(BOOKS_UPDATED_EVENT));
};

export const useUploadedBooks = () => {
  const [uploadedBooks, setUploadedBooks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadBooks = async () => {
    setIsLoading(true);
    try {
      const books = await getUploadedBooks();
      setUploadedBooks(books);
    } catch (error) {
      console.error('Failed to load uploaded books:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBooks();

    // Listen for book updates
    const handleBooksUpdate = () => {
      loadBooks();
    };

    window.addEventListener(BOOKS_UPDATED_EVENT, handleBooksUpdate);

    // Also reload when page becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadBooks();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener(BOOKS_UPDATED_EVENT, handleBooksUpdate);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return { uploadedBooks, isLoading, reload: loadBooks };
};
