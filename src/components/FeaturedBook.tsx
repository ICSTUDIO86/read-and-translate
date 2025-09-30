import { Book } from '@/types/book';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface FeaturedBookProps {
  book: Book;
}

const FeaturedBook = ({ book }: FeaturedBookProps) => {
  const navigate = useNavigate();

  return (
    <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-3xl p-6 flex gap-4 items-start">
      <div className="flex-shrink-0">
        <div className="w-24 h-36 rounded-xl overflow-hidden shadow-lg">
          <img 
            src={book.cover} 
            alt={book.title}
            className="w-full h-full object-cover"
          />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-primary font-semibold mb-1">Popular</p>
        <h2 className="text-lg font-bold text-foreground mb-1 line-clamp-2">
          {book.title}
        </h2>
        <p className="text-sm text-muted-foreground mb-3">
          {book.author} (2020)
        </p>
        <Button 
          variant="gold" 
          size="sm"
          onClick={() => navigate(`/book/${book.id}`)}
        >
          Read More
        </Button>
      </div>
    </div>
  );
};

export default FeaturedBook;
