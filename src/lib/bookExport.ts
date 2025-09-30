// Book export and share utilities
import { Book } from '@/types/book';

// Export book as JSON
export const exportBookAsJSON = (book: Book): void => {
  const dataStr = JSON.stringify(book, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${book.title.replace(/[^a-z0-9]/gi, '_')}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};

// Export book as TXT
export const exportBookAsTXT = (book: Book): void => {
  if (!book.chapters || book.chapters.length === 0) {
    throw new Error('No content to export');
  }

  let content = `${book.title}\n`;
  content += `By ${book.author}\n\n`;
  content += `${book.synopsis}\n\n`;
  content += '='.repeat(50) + '\n\n';

  book.chapters.forEach((chapter, chapterIndex) => {
    content += `\n${chapter.title}\n`;
    content += '-'.repeat(chapter.title.length) + '\n\n';

    chapter.paragraphs.forEach((paragraph) => {
      content += `${paragraph.text}\n\n`;
    });
  });

  const dataBlob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(dataBlob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${book.title.replace(/[^a-z0-9]/gi, '_')}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};

// Import book from JSON
export const importBookFromJSON = async (file: File): Promise<Book> => {
  const text = await file.text();
  const book = JSON.parse(text) as Book;

  // Validate required fields
  if (!book.id || !book.title || !book.author) {
    throw new Error('Invalid book file format');
  }

  // Generate new ID to avoid conflicts
  book.id = `imported-${Date.now()}`;

  return book;
};

// Share book on social media
export const shareToTwitter = (book: Book): void => {
  const text = `Currently reading "${book.title}" by ${book.author}`;
  const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank', 'width=550,height=420');
};

export const shareToFacebook = (book: Book): void => {
  const text = `I'm reading "${book.title}" by ${book.author}`;
  const url = `https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(text)}`;
  window.open(url, '_blank', 'width=550,height=420');
};

export const shareToWhatsApp = (book: Book): void => {
  const text = `Check out this book: "${book.title}" by ${book.author}`;
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
};

export const shareToEmail = (book: Book): void => {
  const subject = `Book Recommendation: ${book.title}`;
  const body = `I thought you might enjoy this book:\n\nTitle: ${book.title}\nAuthor: ${book.author}\n\n${book.synopsis}`;
  const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.location.href = url;
};

// Copy book link to clipboard
export const copyBookLink = (book: Book): Promise<void> => {
  const url = `${window.location.origin}/book/${book.id}`;
  return navigator.clipboard.writeText(url);
};

// Generate reading card image (returns data URL)
export const generateReadingCard = (book: Book): string => {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 400;
  const ctx = canvas.getContext('2d');

  if (!ctx) throw new Error('Canvas not supported');

  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, 800, 400);
  gradient.addColorStop(0, '#f59e0b');
  gradient.addColorStop(1, '#fbbf24');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 800, 400);

  // Add text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 48px sans-serif';
  ctx.textAlign = 'center';

  // Title
  const title = book.title.length > 30 ? book.title.substring(0, 27) + '...' : book.title;
  ctx.fillText(title, 400, 150);

  // Author
  ctx.font = '32px sans-serif';
  ctx.fillText(`by ${book.author}`, 400, 200);

  // Progress or rating
  ctx.font = '24px sans-serif';
  if (book.progress) {
    ctx.fillText(`${book.progress}% Complete`, 400, 280);
  } else {
    ctx.fillText(`Rating: ${book.rating} ⭐`, 400, 280);
  }

  // App name
  ctx.font = 'italic 20px sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.fillText('Read & Translate', 400, 360);

  return canvas.toDataURL('image/png');
};

// Download reading card
export const downloadReadingCard = (book: Book): void => {
  const dataUrl = generateReadingCard(book);
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = `${book.title.replace(/[^a-z0-9]/gi, '_')}_card.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
