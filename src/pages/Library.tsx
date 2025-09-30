import { useState, useEffect } from 'react';
import { books } from '@/types/book';
import BookCard from '@/components/BookCard';
import BottomNav from '@/components/BottomNav';
import BookUpload from '@/components/BookUpload';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Upload, Trash2 } from 'lucide-react';
import { getUploadedBooks, deleteUploadedBook } from '@/lib/storage';
import { toast } from 'sonner';
import bookPsychologyMoney from '@/assets/book-psychology-money.jpg';
import bookSapiens from '@/assets/book-sapiens.jpg';
import bookDesignEveryday from '@/assets/book-design-everyday.jpg';
import bookAtomicHabits from '@/assets/book-atomic-habits.jpg';
import bookDeepWork from '@/assets/book-deep-work.jpg';
import bookThinkingFastSlow from '@/assets/book-thinking-fast-slow.jpg';

const Library = () => {
  const [uploadedBooks, setUploadedBooks] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Load uploaded books
  const loadUploadedBooks = () => {
    const uploaded = getUploadedBooks();
    setUploadedBooks(uploaded);
  };

  useEffect(() => {
    loadUploadedBooks();
  }, []);

  // Map imported images to books
  const booksWithImages = books.map(book => {
    let cover = book.cover;
    if (book.id === '1') cover = bookPsychologyMoney;
    if (book.id === '2') cover = bookSapiens;
    if (book.id === '3') cover = bookDesignEveryday;
    if (book.id === '4') cover = bookAtomicHabits;
    if (book.id === '5') cover = bookDeepWork;
    if (book.id === '6') cover = bookThinkingFastSlow;
    return { ...book, cover };
  });

  const myBooks = booksWithImages.filter(b => b.isFree);

  const handleUploadSuccess = () => {
    loadUploadedBooks();
    setDialogOpen(false);
  };

  const handleDeleteBook = (bookId: string) => {
    deleteUploadedBook(bookId);
    loadUploadedBooks();
    toast.success('Book deleted successfully');
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
        {uploadedBooks.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-4">Uploaded Books</h2>
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
        )}

        <div className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">Downloaded Books</h2>
          <div className="grid grid-cols-3 gap-4">
            {myBooks.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Recently Read</h2>
          <div className="space-y-3">
            {booksWithImages.slice(0, 3).map((book) => (
              <div key={book.id} className="flex gap-4 bg-card rounded-2xl p-4 shadow-sm">
                <div className="w-16 h-24 flex-shrink-0 rounded-lg overflow-hidden">
                  <img 
                    src={book.cover} 
                    alt={book.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm mb-1 line-clamp-2">{book.title}</h3>
                  <p className="text-xs text-muted-foreground mb-2">{book.author}</p>
                  <p className="text-xs text-muted-foreground">{book.pages} pages</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Library;
