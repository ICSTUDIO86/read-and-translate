import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase configuration missing. Cloud sync will be disabled.');
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || '',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  }
);

// Check if Supabase is configured
export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseAnonKey);
};

// Database types
export interface Database {
  public: {
    Tables: {
      books: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          author: string | null;
          cover_url: string | null;
          chapters: any;
          uploaded_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          user_id: string;
          title: string;
          author?: string | null;
          cover_url?: string | null;
          chapters: any;
          uploaded_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          author?: string | null;
          cover_url?: string | null;
          chapters?: any;
          uploaded_at?: string;
          updated_at?: string;
        };
      };
      reading_progress: {
        Row: {
          id: string;
          user_id: string;
          book_id: string;
          current_chapter: number;
          current_paragraph: number;
          last_read: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          book_id: string;
          current_chapter: number;
          current_paragraph: number;
          last_read?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          book_id?: string;
          current_chapter?: number;
          current_paragraph?: number;
          last_read?: string;
          updated_at?: string;
        };
      };
      user_settings: {
        Row: {
          id: string;
          user_id: string;
          reader_settings: any;
          tts_configuration: any;
          reading_stats: any;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          reader_settings?: any;
          tts_configuration?: any;
          reading_stats?: any;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          reader_settings?: any;
          tts_configuration?: any;
          reading_stats?: any;
          updated_at?: string;
        };
      };
      favorites: {
        Row: {
          id: string;
          user_id: string;
          book_id: string;
          added_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          book_id: string;
          added_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          book_id?: string;
          added_at?: string;
        };
      };
    };
  };
}
