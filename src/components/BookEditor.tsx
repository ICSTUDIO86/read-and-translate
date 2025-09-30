import { useState } from 'react';
import { Book } from '@/types/book';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Save, X, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { saveUploadedBook } from '@/lib/storage';

interface BookEditorProps {
  book: Book;
  onSave?: (book: Book) => void;
  onCancel?: () => void;
}

const BookEditor = ({ book, onSave, onCancel }: BookEditorProps) => {
  const [editedBook, setEditedBook] = useState<Book>(book);
  const [coverPreview, setCoverPreview] = useState<string | null>(book.cover);
  const [isUploading, setIsUploading] = useState(false);

  const genres = [
    'Fiction', 'Non-Fiction', 'Mystery', 'Romance', 'Sci-Fi',
    'Fantasy', 'Biography', 'History', 'Self-Help', 'Business',
    'Science', 'Philosophy', 'Poetry', 'Drama', 'Thriller',
    'Horror', 'Adventure', 'Children', 'Young Adult', 'Uploaded'
  ];

  const languages = [
    'English', 'Chinese', 'Spanish', 'French', 'German',
    'Japanese', 'Korean', 'Russian', 'Arabic', 'Portuguese'
  ];

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setIsUploading(true);

    // Convert to base64
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setCoverPreview(dataUrl);
      setEditedBook({ ...editedBook, cover: dataUrl });
      setIsUploading(false);
      toast.success('Cover image uploaded');
    };

    reader.onerror = () => {
      toast.error('Failed to read image');
      setIsUploading(false);
    };

    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    // Validate required fields
    if (!editedBook.title.trim()) {
      toast.error('Title is required');
      return;
    }

    if (!editedBook.author.trim()) {
      toast.error('Author is required');
      return;
    }

    // Save to localStorage
    saveUploadedBook(editedBook);

    toast.success('Book updated successfully');
    onSave?.(editedBook);
  };

  return (
    <div className="space-y-6">
      {/* Cover Image Upload */}
      <div>
        <Label>Cover Image</Label>
        <div className="mt-2 flex items-start gap-4">
          <div className="relative w-32 h-48 bg-secondary rounded-lg overflow-hidden border-2 border-dashed border-border hover:border-primary transition-colors">
            {coverPreview ? (
              <img
                src={coverPreview}
                alt="Cover preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <ImageIcon className="h-12 w-12 text-muted-foreground" />
              </div>
            )}

            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            )}
          </div>

          <div className="flex-1">
            <label className="cursor-pointer">
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleCoverUpload}
              />
              <Button variant="outline" size="sm" asChild>
                <span>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Cover
                </span>
              </Button>
            </label>
            <p className="text-xs text-muted-foreground mt-2">
              Recommended: 400x600px, max 5MB
            </p>
          </div>
        </div>
      </div>

      {/* Title */}
      <div>
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={editedBook.title}
          onChange={(e) => setEditedBook({ ...editedBook, title: e.target.value })}
          placeholder="Enter book title"
          className="mt-2"
        />
      </div>

      {/* Author */}
      <div>
        <Label htmlFor="author">Author *</Label>
        <Input
          id="author"
          value={editedBook.author}
          onChange={(e) => setEditedBook({ ...editedBook, author: e.target.value })}
          placeholder="Enter author name"
          className="mt-2"
        />
      </div>

      {/* Synopsis */}
      <div>
        <Label htmlFor="synopsis">Synopsis</Label>
        <Textarea
          id="synopsis"
          value={editedBook.synopsis}
          onChange={(e) => setEditedBook({ ...editedBook, synopsis: e.target.value })}
          placeholder="Enter book description"
          className="mt-2 min-h-[100px]"
        />
      </div>

      {/* Genre and Language */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="genre">Genre</Label>
          <Select
            value={editedBook.genre}
            onValueChange={(value) => setEditedBook({ ...editedBook, genre: value })}
          >
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="Select genre" />
            </SelectTrigger>
            <SelectContent>
              {genres.map((genre) => (
                <SelectItem key={genre} value={genre}>
                  {genre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="language">Language</Label>
          <Select
            value={editedBook.language}
            onValueChange={(value) => setEditedBook({ ...editedBook, language: value })}
          >
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              {languages.map((lang) => (
                <SelectItem key={lang} value={lang}>
                  {lang}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Rating */}
      <div>
        <Label htmlFor="rating">Rating (0-5)</Label>
        <Input
          id="rating"
          type="number"
          min="0"
          max="5"
          step="0.1"
          value={editedBook.rating}
          onChange={(e) => setEditedBook({ ...editedBook, rating: parseFloat(e.target.value) || 0 })}
          className="mt-2"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3 pt-4 border-t">
        <Button onClick={handleSave} className="flex-1">
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
        {onCancel && (
          <Button onClick={onCancel} variant="outline" className="flex-1">
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
};

export default BookEditor;
