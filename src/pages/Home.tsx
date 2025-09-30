import { useState, useEffect } from 'react';
import { books, genres } from '@/types/book';
import FeaturedBook from '@/components/FeaturedBook';
import BookCard from '@/components/BookCard';
import BottomNav from '@/components/BottomNav';
import { cn } from '@/lib/utils';
import { getAllReadingProgress, getUploadedBooks } from '@/lib/storage';
import bookPsychologyMoney from '@/assets/book-psychology-money.jpg';
import bookSapiens from '@/assets/book-sapiens.jpg';
import bookDesignEveryday from '@/assets/book-design-everyday.jpg';
import bookAtomicHabits from '@/assets/book-atomic-habits.jpg';
import bookDeepWork from '@/assets/book-deep-work.jpg';
import bookThinkingFastSlow from '@/assets/book-thinking-fast-slow.jpg';

const Home = () => {
  const [selectedGenre, setSelectedGenre] = useState('All Genre');
  const [readingProgress, setReadingProgress] = useState<any[]>([]);
  const [uploadedBooks, setUploadedBooks] = useState<any[]>([]);

  useEffect(() => {
    // Load reading progress from localStorage
    const progress = getAllReadingProgress();
    setReadingProgress(progress);

    // Load uploaded books
    const uploaded = getUploadedBooks();
    setUploadedBooks(uploaded);
  }, []);

  // Map imported images to preset books and add progress
  const booksWithImages = books.map(book => {
    let cover = book.cover;
    if (book.id === '1') cover = bookPsychologyMoney;
    if (book.id === '2') cover = bookSapiens;
    if (book.id === '3') cover = bookDesignEveryday;
    if (book.id === '4') cover = bookAtomicHabits;
    if (book.id === '5') cover = bookDeepWork;
    if (book.id === '6') cover = bookThinkingFastSlow;

    // Calculate progress based on saved data
    const savedProgress = readingProgress.find(p => p.bookId === book.id);
    let progressPercent = book.progress;

    if (savedProgress && book.chapters) {
      const totalParagraphs = book.chapters.reduce((total, ch) => total + ch.paragraphs.length, 0);
      let currentPosition = 0;
      for (let i = 0; i < savedProgress.currentChapter; i++) {
        currentPosition += book.chapters[i].paragraphs.length;
      }
      currentPosition += savedProgress.currentParagraph + 1;
      progressPercent = Math.round((currentPosition / totalParagraphs) * 100);
    }

    return { ...book, cover, progress: progressPercent };
  });

  // Add progress to uploaded books
  const uploadedBooksWithProgress = uploadedBooks.map(book => {
    const savedProgress = readingProgress.find(p => p.bookId === book.id);
    let progressPercent = 0;

    if (savedProgress && book.chapters) {
      const totalParagraphs = book.chapters.reduce((total: number, ch: any) => total + ch.paragraphs.length, 0);
      let currentPosition = 0;
      for (let i = 0; i < savedProgress.currentChapter; i++) {
        currentPosition += book.chapters[i].paragraphs.length;
      }
      currentPosition += savedProgress.currentParagraph + 1;
      progressPercent = Math.round((currentPosition / totalParagraphs) * 100);
    }

    return { ...book, progress: progressPercent };
  });

  // Combine all books
  const allBooks = [...booksWithImages, ...uploadedBooksWithProgress];

  const featuredBook = booksWithImages[0];
  const continueReading = allBooks.filter(b => b.progress && b.progress > 0);

  const filteredBooks = selectedGenre === 'All Genre'
    ? allBooks
    : allBooks.filter(b => b.genre === selectedGenre);

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Featured Book */}
        <div className="mb-6">
          <FeaturedBook book={featuredBook} />
        </div>

        {/* Genre Tabs */}
        <div className="mb-6 overflow-x-auto scrollbar-hide">
          <div className="flex gap-2 min-w-max pb-2">
            {genres.map((genre) => (
              <button
                key={genre}
                onClick={() => setSelectedGenre(genre)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                  selectedGenre === genre
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                )}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>

        {/* Books Grid */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {filteredBooks.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>

        {/* Continue Reading */}
        {continueReading.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-foreground mb-4">Continue Reading</h2>
            <div className="space-y-4">
              {continueReading.map((book) => (
                <div key={book.id} className="flex gap-4 bg-card rounded-2xl p-4 shadow-sm">
                  <div className="w-16 h-24 flex-shrink-0 rounded-lg overflow-hidden">
                    <img 
                      src={book.cover} 
                      alt={book.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm mb-1 line-clamp-2">{book.title}</h3>
                    <p className="text-xs text-muted-foreground mb-2">{book.author}</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${book.progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">{book.progress}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Home;
