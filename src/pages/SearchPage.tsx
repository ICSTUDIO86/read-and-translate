import { useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import BookCard from '@/components/BookCard';
import BottomNav from '@/components/BottomNav';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useUploadedBooks } from '@/hooks/useUploadedBooks';

const filters = ['All Result', 'Free', 'Premium', 'Author', 'Genre'];

const SearchPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All Result');
  const { uploadedBooks, isLoading } = useUploadedBooks();

  // Only search uploaded books
  const filteredBooks = uploadedBooks.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         book.author.toLowerCase().includes(searchQuery.toLowerCase());

    if (selectedFilter === 'Free') return matchesSearch && book.isFree;
    if (selectedFilter === 'Premium') return matchesSearch && !book.isFree;

    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search Book"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-12 h-12 rounded-2xl bg-card border-0 shadow-sm"
            />
            <button className="absolute right-4 top-1/2 -translate-y-1/2">
              <SlidersHorizontal className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 overflow-x-auto scrollbar-hide">
          <div className="flex gap-2 min-w-max pb-2">
            {filters.map((filter) => (
              <button
                key={filter}
                onClick={() => setSelectedFilter(filter)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                  selectedFilter === filter
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                )}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-muted-foreground">Loading books...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              {filteredBooks.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>

            {filteredBooks.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No books found</p>
              </div>
            )}
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default SearchPage;
