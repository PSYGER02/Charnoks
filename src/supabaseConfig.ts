import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Database types
export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          email: string | null;
          display_name: string | null;
          role: 'owner' | 'worker';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          display_name?: string | null;
          role?: 'owner' | 'worker';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          display_name?: string | null;
          role?: 'owner' | 'worker';
          created_at?: string;
          updated_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          name: string;
          price: number;
          stock: number;
          category: string | null;
          image_url: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          price: number;
          stock?: number;
          category?: string | null;
          image_url?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          price?: number;
          stock?: number;
          category?: string | null;
          image_url?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      sales: {
        Row: {
          id: string;
          items: any; // JSONB
          total: number;
          payment: number;
          change: number;
          worker_id: string | null;
          worker_name: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          items: any;
          total: number;
          payment: number;
          change: number;
          worker_id?: string | null;
          worker_name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          items?: any;
          total?: number;
          payment?: number;
          change?: number;
          worker_id?: string | null;
          worker_name?: string | null;
          created_at?: string;
        };
      };
      expenses: {
        Row: {
          id: string;
          description: string;
          amount: number;
          worker_id: string | null;
          worker_name: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          description: string;
          amount: number;
          worker_id?: string | null;
          worker_name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          description?: string;
          amount?: number;
          worker_id?: string | null;
          worker_name?: string | null;
          created_at?: string;
        };
      };
      notes: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          category: string | null;
          amount: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          category?: string | null;
          amount?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          category?: string | null;
          amount?: number | null;
          created_at?: string;
        };
      };
    };
  };
}