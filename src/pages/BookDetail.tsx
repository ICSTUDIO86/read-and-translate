import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Share2, BookOpen, Play, Pause, ChevronLeft, ChevronRight, Volume2, Languages, Edit } from 'lucide-react';
import { books } from '@/types/book';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import BookReader from '@/components/BookReader';
import BookEditor from '@/components/BookEditor';
import ShareMenu from '@/components/ShareMenu';
import { getUploadedBooks } from '@/lib/supabaseStorage';
import bookPsychologyMoney from '@/assets/book-psychology-money.jpg';
import bookSapiens from '@/assets/book-sapiens.jpg';
import bookDesignEveryday from '@/assets/book-design-everyday.jpg';
import bookAtomicHabits from '@/assets/book-atomic-habits.jpg';
import bookDeepWork from '@/assets/book-deep-work.jpg';
import bookThinkingFastSlow from '@/assets/book-thinking-fast-slow.jpg';

const BookDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [progress, setProgress] = useState(0);
  const [showTranslation, setShowTranslation] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentBook, setCurrentBook] = useState<any>(null);

  // Update current book when id changes
  useEffect(() => {
    const loadBook = async () => {
      const uploadedBooks = await getUploadedBooks();
      const allBooks = [...books, ...uploadedBooks];
      const bookData = allBooks.find(b => b.id === id);

      if (bookData) {
        setCurrentBook(bookData);
      }
    };

    loadBook();
  }, [id]);

  if (!currentBook) {
    return <div>Book not found</div>;
  }

  // Check if this is an uploaded book
  const isUploadedBook = currentBook.id.startsWith('uploaded-') || currentBook.id.startsWith('imported-');

  // Map image for preset books
  let cover = currentBook.cover;
  if (currentBook.id === '1') cover = bookPsychologyMoney;
  if (currentBook.id === '2') cover = bookSapiens;
  if (currentBook.id === '3') cover = bookDesignEveryday;
  if (currentBook.id === '4') cover = bookAtomicHabits;
  if (currentBook.id === '5') cover = bookDeepWork;
  if (currentBook.id === '6') cover = bookThinkingFastSlow;

  const book = { ...currentBook, cover };
  const totalPages = book.pages;

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    
    if (!isPlaying) {
      toast.success('开始AI朗读', {
        description: '使用先进的AI技术为您朗读内容',
      });
    } else {
      toast.info('已暂停朗读');
    }
  };

  const handleTranslate = () => {
    setShowTranslation(!showTranslation);
    
    if (!showTranslation) {
      toast.success('翻译功能已启用', {
        description: '内容将被翻译成中文',
      });
    } else {
      toast.info('已关闭翻译');
    }
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newProgress = Number(e.target.value);
    setProgress(newProgress);
    setCurrentPage(Math.floor((newProgress / 100) * totalPages) + 1);
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      setProgress(((currentPage - 2) / totalPages) * 100);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      setProgress((currentPage / totalPages) * 100);
    }
  };

  const handleProgressUpdate = (chapterIndex: number, paragraphIndex: number) => {
    console.log('Progress:', chapterIndex, paragraphIndex);
  };

  const handleBookSaved = (updatedBook: any) => {
    setCurrentBook(updatedBook);
    setIsEditing(false);
    toast.success('Book updated successfully');
  };

  // Show reader mode if reading
  if (isReading && book.chapters && book.chapters.length > 0) {
    return (
      <div className="h-screen">
        <BookReader
          book={book}
          onProgressChange={handleProgressUpdate}
          onClose={() => setIsReading(false)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-border">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-secondary rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex gap-2">
            {book.chapters && book.chapters.length > 0 && (
              <button
                onClick={() => setIsReading(true)}
                className="p-2 hover:bg-secondary rounded-lg transition-colors"
                title="Start Reading"
              >
                <BookOpen className="h-5 w-5" />
              </button>
            )}
            {isUploadedBook && (
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 hover:bg-secondary rounded-lg transition-colors"
                title="Edit Book"
              >
                <Edit className="h-5 w-5" />
              </button>
            )}
            <ShareMenu book={book} />
          </div>
        </div>

        {/* Book Info */}
        <div className="px-4 py-8 text-center">
          <div className="w-48 h-72 mx-auto mb-6 rounded-2xl overflow-hidden shadow-2xl">
            <img
              src={book.cover}
              alt={book.title}
              className="w-full h-full object-cover"
            />
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-2">{book.title}</h1>
          <p className="text-muted-foreground mb-4">{book.author}</p>

          {/* Start Reading Button */}
          {book.chapters && book.chapters.length > 0 && (
            <Button
              onClick={() => setIsReading(true)}
              className="mb-4 gap-2"
              size="lg"
            >
              <BookOpen className="h-5 w-5" />
              Start Reading
            </Button>
          )}
          
          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="text-center">
              <div className="flex items-center gap-1 text-primary font-semibold">
                <span className="text-lg">{book.rating}</span>
              </div>
              <p className="text-xs text-muted-foreground">Rating</p>
            </div>
            <div className="text-center">
              <p className="font-semibold text-foreground">{book.pages}</p>
              <p className="text-xs text-muted-foreground">Number Of Page</p>
            </div>
            <div className="text-center">
              <p className="font-semibold text-foreground">{book.language}</p>
              <p className="text-xs text-muted-foreground">Language</p>
            </div>
            <div className="text-center">
              <p className="font-semibold text-foreground">{book.audioLength}</p>
              <p className="text-xs text-muted-foreground">Audio</p>
            </div>
          </div>
        </div>

        {/* Synopsis */}
        <div className="px-4 py-6 bg-card">
          <h2 className="text-lg font-bold text-foreground mb-3">Synopsis</h2>
          <div className="relative">
            <p className={cn(
              "text-sm text-muted-foreground leading-relaxed",
              showTranslation && "mb-4"
            )}>
              {book.synopsis}
            </p>
            
            {showTranslation && (
              <div className="mt-4 p-4 bg-primary/5 rounded-xl border border-primary/20">
                <p className="text-sm text-foreground leading-relaxed">
                  做好金钱管理不一定取决于你知道什么。它更多地关乎你如何行事。而行为很难教，即使是对非常聪明的人来说也是如此。
                </p>
              </div>
            )}

            {/* Text Formatting Toolbar */}
            <div className="flex gap-2 mt-4">
              <button 
                onClick={handleTranslate}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  showTranslation 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                )}
              >
                <Languages className="h-4 w-4" />
              </button>
              <button className="p-2 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors">
                <Volume2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Audio Player */}
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
          <div className="max-w-2xl mx-auto px-4 py-4">
            {/* Progress Bar */}
            <div className="flex items-center gap-3 mb-4">
              <button 
                className="p-2 hover:bg-secondary rounded-lg transition-colors"
                onClick={handlePlayPause}
              >
                <Volume2 className="h-4 w-4 text-primary" />
              </button>
              <input
                type="range"
                min="0"
                max="100"
                value={progress}
                onChange={handleProgressChange}
                className="flex-1 h-1 bg-secondary rounded-full appearance-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none 
                  [&::-webkit-slider-thumb]:w-3 
                  [&::-webkit-slider-thumb]:h-3 
                  [&::-webkit-slider-thumb]:rounded-full 
                  [&::-webkit-slider-thumb]:bg-primary
                  [&::-webkit-slider-thumb]:cursor-pointer"
              />
              <span className="text-sm text-muted-foreground min-w-[60px] text-right">
                {book.audioLength}
              </span>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4">
              <button 
                onClick={goToPrevPage}
                className="p-3 bg-primary/10 rounded-full hover:bg-primary/20 transition-colors"
              >
                <ChevronLeft className="h-5 w-5 text-primary" />
              </button>
              
              <button 
                onClick={handlePlayPause}
                className="p-4 bg-primary rounded-full hover:bg-primary/90 transition-all shadow-lg"
              >
                {isPlaying ? (
                  <Pause className="h-6 w-6 text-primary-foreground" />
                ) : (
                  <Play className="h-6 w-6 text-primary-foreground ml-0.5" />
                )}
              </button>

              <button 
                onClick={goToNextPage}
                className="p-3 bg-primary/10 rounded-full hover:bg-primary/20 transition-colors"
              >
                <ChevronRight className="h-5 w-5 text-primary" />
              </button>
            </div>

            {/* Page Indicator */}
            <div className="text-center mt-3">
              <span className="text-sm font-medium text-foreground">
                {currentPage} / {totalPages}
              </span>
            </div>
          </div>
        </div>

        <div className="h-52"></div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Book</DialogTitle>
          </DialogHeader>
          <BookEditor
            book={book}
            onSave={handleBookSaved}
            onCancel={() => setIsEditing(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BookDetail;
