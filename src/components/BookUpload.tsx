import { useState, useCallback } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { parseBookFile, validateBookFile } from '@/lib/bookParser';
import { importBookFromJSON } from '@/lib/bookExport';
import { saveUploadedBook } from '@/lib/storage';
import { toast } from 'sonner';

interface BookUploadProps {
  onUploadSuccess?: () => void;
}

const BookUpload = ({ onUploadSuccess }: BookUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setUploadedFile(file);
    setUploadStatus('idle');

    const extension = file.name.split('.').pop()?.toLowerCase();

    // Show different messages based on file type
    if (extension === 'pdf') {
      toast.info('Parsing PDF...', {
        description: 'This may take a moment for large files',
      });
    } else if (extension === 'epub') {
      toast.info('Parsing EPUB...', {
        description: 'Extracting text and metadata',
      });
    }

    try {
      let book;

      // Handle JSON import separately
      if (extension === 'json') {
        console.log('Importing JSON file...');
        book = await importBookFromJSON(file);
      } else {
        // Validate file for other formats
        const validation = validateBookFile(file);
        if (!validation.valid) {
          toast.error('Invalid file', {
            description: validation.error,
          });
          setUploadStatus('error');
          setIsProcessing(false);
          return;
        }

        // Parse the file
        console.log(`Parsing ${extension?.toUpperCase()} file:`, file.name);
        book = await parseBookFile(file);
        console.log('Parsing result:', book ? 'Success' : 'Failed', book);
      }

      if (!book) {
        throw new Error('Failed to parse book file - no content extracted');
      }

      // Validate book has content
      if (!book.chapters || book.chapters.length === 0) {
        throw new Error('No chapters found in the book');
      }

      // Save to localStorage
      saveUploadedBook(book);

      setUploadStatus('success');
      toast.success('Book uploaded successfully!', {
        description: `"${book.title}" (${book.chapters.length} chapters) has been added to your library`,
      });

      onUploadSuccess?.();
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('error');

      // Provide more helpful error messages
      let errorMsg = 'Unknown error occurred';
      if (error instanceof Error) {
        errorMsg = error.message;
      }

      toast.error('Upload failed', {
        description: errorMsg,
        duration: 5000,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      await processFile(file);
    }
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  return (
    <div className="w-full">
      <div
        className={cn(
          "relative border-2 border-dashed rounded-2xl p-8 transition-all",
          isDragging
            ? "border-primary bg-primary/5 scale-[1.02]"
            : "border-border bg-card hover:border-primary/50",
          isProcessing && "opacity-50 pointer-events-none"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          {/* Icon */}
          <div className={cn(
            "p-4 rounded-full transition-colors",
            uploadStatus === 'success' ? "bg-green-500/10" :
            uploadStatus === 'error' ? "bg-red-500/10" :
            "bg-primary/10"
          )}>
            {uploadStatus === 'success' ? (
              <CheckCircle className="h-8 w-8 text-green-500" />
            ) : uploadStatus === 'error' ? (
              <AlertCircle className="h-8 w-8 text-red-500" />
            ) : (
              <Upload className="h-8 w-8 text-primary" />
            )}
          </div>

          {/* Text */}
          <div>
            <h3 className="text-lg font-semibold mb-1">
              {isProcessing ? 'Processing...' :
               uploadStatus === 'success' ? 'Upload Successful!' :
               uploadStatus === 'error' ? 'Upload Failed' :
               'Upload a Book'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {isProcessing ? 'Please wait while we process your book...' :
               uploadStatus === 'success' ? `"${uploadedFile?.name}" added to library` :
               uploadStatus === 'error' ? 'Please try again with a different file' :
               'Drag and drop or click to select'}
            </p>
          </div>

          {/* File input */}
          {uploadStatus !== 'success' && !isProcessing && (
            <label className="cursor-pointer">
              <input
                type="file"
                className="hidden"
                accept=".txt,.pdf,.epub,.json"
                onChange={handleFileSelect}
              />
              <Button variant="default" className="mt-2" asChild>
                <span>
                  <FileText className="h-4 w-4 mr-2" />
                  Select File
                </span>
              </Button>
            </label>
          )}

          {/* Supported formats */}
          <div className="text-xs text-muted-foreground">
            Supported formats: TXT, PDF, EPUB, JSON (max 100MB)
          </div>
        </div>

        {/* Processing spinner */}
        {isProcessing && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm rounded-2xl">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        )}
      </div>

      {/* Current file info */}
      {uploadedFile && uploadStatus === 'success' && (
        <div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-green-500 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{uploadedFile.name}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {(uploadedFile.size / 1024).toFixed(2)} KB
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 space-y-2">
        <h4 className="text-sm font-medium">Tips for best results:</h4>
        <ul className="text-xs text-muted-foreground space-y-1 pl-5 list-disc">
          <li>✅ TXT files are parsed immediately with smart chapter detection</li>
          <li>✅ PDF files are fully supported - text extraction works great</li>
          <li>✅ EPUB files preserve metadata and chapter structure</li>
          <li>✅ JSON files let you import previously exported books</li>
          <li>Use clear chapter headings like "Chapter 1" or "CHAPTER ONE"</li>
          <li>Separate paragraphs with line breaks for better formatting</li>
        </ul>
      </div>
    </div>
  );
};

export default BookUpload;
