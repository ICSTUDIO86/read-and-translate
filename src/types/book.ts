export interface Paragraph {
  id: string;
  text: string;
  translation?: string; // Deprecated - use type: 'translated' instead
  isHeading?: boolean;
  headingLevel?: number; // 1-6 for h1-h6
  isImage?: boolean;
  imageUrl?: string;
  imageAlt?: string;
  type?: 'original' | 'translated'; // Indicates if this is original text or translation
  language?: string; // Language code (e.g., 'en', 'zh')
}

export interface Chapter {
  id: string;
  title: string;
  paragraphs: Paragraph[];
}

export interface Book {
  id: string;
  title: string;
  author: string;
  cover: string;
  rating: number;
  pages: number;
  language: string;
  audioLength: string;
  genre: string;
  synopsis: string;
  isFree: boolean;
  progress?: number;
  chapters?: Chapter[];
  currentChapter?: number;
  currentParagraph?: number;
}

// Template books removed - see CLAUDE.md for backup and restoration instructions
export const books: Book[] = [];

export const genres = ['All Genre', 'Finance', 'History', 'Design', 'Self-Help', 'Productivity', 'Psychology'];
