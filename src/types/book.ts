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
}

export const books: Book[] = [
  {
    id: '1',
    title: 'The Psychology Of Money',
    author: 'Morgan Housel',
    cover: '/src/assets/book-psychology-money.jpg',
    rating: 4.4,
    pages: 262,
    language: 'English',
    audioLength: '2h14m',
    genre: 'Finance',
    synopsis: "Doing well with money isn't necessarily about what you know. It's about how you behave. And behavior is hard to teach, even to really smart people.",
    isFree: true,
    progress: 35
  },
  {
    id: '2',
    title: 'Sapiens: A Brief History of Humankind',
    author: 'Yuval Noah Harari',
    cover: '/src/assets/book-sapiens.jpg',
    rating: 4.6,
    pages: 443,
    language: 'English',
    audioLength: '15h17m',
    genre: 'History',
    synopsis: "From a renowned historian comes a groundbreaking narrative of humanity's creation and evolution that explores the ways in which biology and history have defined us.",
    isFree: true
  },
  {
    id: '3',
    title: 'The Design of Everyday Things',
    author: 'Don Norman',
    cover: '/src/assets/book-design-everyday.jpg',
    rating: 4.5,
    pages: 368,
    language: 'English',
    audioLength: '11h45m',
    genre: 'Design',
    synopsis: "Design doesn't really start with aesthetics. It starts with understanding the user's needs and creating experiences that are intuitive and enjoyable.",
    isFree: false
  },
  {
    id: '4',
    title: 'Atomic Habits',
    author: 'James Clear',
    cover: '/src/assets/book-atomic-habits.jpg',
    rating: 4.8,
    pages: 320,
    language: 'English',
    audioLength: '5h35m',
    genre: 'Self-Help',
    synopsis: 'No matter your goals, Atomic Habits offers a proven framework for improving every day. James Clear reveals practical strategies that will teach you exactly how to form good habits.',
    isFree: true,
    progress: 67
  },
  {
    id: '5',
    title: 'Deep Work',
    author: 'Cal Newport',
    cover: '/src/assets/book-deep-work.jpg',
    rating: 4.3,
    pages: 304,
    language: 'English',
    audioLength: '7h44m',
    genre: 'Productivity',
    synopsis: "Deep work is the ability to focus without distraction on a cognitively demanding task. It's a skill that allows you to quickly master complicated information.",
    isFree: false
  },
  {
    id: '6',
    title: 'Thinking, Fast and Slow',
    author: 'Daniel Kahneman',
    cover: '/src/assets/book-thinking-fast-slow.jpg',
    rating: 4.2,
    pages: 499,
    language: 'English',
    audioLength: '20h2m',
    genre: 'Psychology',
    synopsis: 'Daniel Kahneman takes us on a groundbreaking tour of the mind and explains the two systems that drive the way we think and make choices.',
    isFree: true
  }
];

export const genres = ['All Genre', 'Finance', 'History', 'Design', 'Self-Help', 'Productivity', 'Psychology'];
