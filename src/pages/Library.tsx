import { useState, useEffect } from 'react';
import BookCard from '@/components/BookCard';
import BottomNav from '@/components/BottomNav';
import BookUpload from '@/components/BookUpload';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Upload, Trash2 } from 'lucide-react';
import { getUploadedBooks, deleteUploadedBook } from '@/lib/supabaseStorage';
import { toast } from 'sonner';
import { triggerBooksUpdate } from '@/hooks/useUploadedBooks';

const Library = () => {
  const [uploadedBooks, setUploadedBooks] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Load uploaded books
  const loadUploadedBooks = async () => {
    const uploaded = await getUploadedBooks();
    setUploadedBooks(uploaded);
  };

  useEffect(() => {
    loadUploadedBooks();
  }, []);

  const handleUploadSuccess = (newBook: any) => {
    // Immediately add the new book to the list (optimistic update)
    setUploadedBooks(prev => [newBook, ...prev]);
    setDialogOpen(false);

    // Trigger global update event for other pages
    triggerBooksUpdate();
  };

  const handleDeleteBook = async (bookId: string) => {
    // Immediately remove from UI (optimistic update)
    setUploadedBooks(prev => prev.filter(book => book.id !== bookId));

    // Delete from storage in background
    deleteUploadedBook(bookId).then(() => {
      toast.success('Book deleted successfully');
      // Trigger global update event for other pages
      triggerBooksUpdate();
    }).catch((err) => {
      console.error('Failed to delete book:', err);
      // Reload on error
      loadUploadedBooks();
      toast.error('Failed to delete book');
    });
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">My Library</h1>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="default" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Upload Book
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Upload Your Book</DialogTitle>
              </DialogHeader>
              <BookUpload onUploadSuccess={handleUploadSuccess} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Uploaded Books */}
        {uploadedBooks.length > 0 ? (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-4">My Books</h2>
            <div className="grid grid-cols-3 gap-4">
              {uploadedBooks.map((book) => (
                <div key={book.id} className="relative group">
                  <BookCard book={book} />
                  <button
                    onClick={() => handleDeleteBook(book.id)}
                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600"
                    title="Delete book"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No books in your library yet</p>
            <p className="text-sm text-muted-foreground">Upload your first book to get started</p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Library;
