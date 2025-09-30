import { Star } from 'lucide-react';
import { Book } from '@/types/book';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface BookCardProps {
  book: Book;
  className?: string;
}

const BookCard = ({ book, className }: BookCardProps) => {
  const navigate = useNavigate();

  return (
    <div 
      className={cn("cursor-pointer group", className)}
      onClick={() => navigate(`/book/${book.id}`)}
    >
      <div className="relative aspect-[2/3] rounded-2xl overflow-hidden shadow-md mb-3 transition-transform duration-300 group-hover:scale-105">
        <img 
          src={book.cover} 
          alt={book.title}
          className="w-full h-full object-cover"
        />
        {book.progress && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
            <div 
              className="h-full bg-primary"
              style={{ width: `${book.progress}%` }}
            />
          </div>
        )}
      </div>
      <div className="space-y-1">
        <h3 className="font-semibold text-sm line-clamp-2 text-foreground">
          {book.title}
        </h3>
        <p className="text-xs text-muted-foreground">{book.author}</p>
        <div className="flex items-center gap-1">
          <Star className="h-3 w-3 fill-primary text-primary" />
          <span className="text-xs font-medium text-foreground">{book.rating}</span>
        </div>
      </div>
    </div>
  );
};

export default BookCard;
