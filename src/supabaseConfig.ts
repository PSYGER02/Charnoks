import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create Supabase client or dummy client if not configured
let supabaseClient: any;

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'undefined' || supabaseAnonKey === 'undefined') {
  console.error('Supabase environment variables missing:', {
    url: supabaseUrl ? 'SET' : 'MISSING',
    key: supabaseAnonKey ? 'SET' : 'MISSING'
  });
  
  // Create a dummy client to prevent crashes
  supabaseClient = {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signUp: () => Promise.reject(new Error('Supabase not configured')),
      signInWithPassword: () => Promise.reject(new Error('Supabase not configured')),
      signOut: () => Promise.reject(new Error('Supabase not configured'))
    },
    from: () => ({
      select: () => Promise.reject(new Error('Supabase not configured')),
      insert: () => Promise.reject(new Error('Supabase not configured')),
      update: () => Promise.reject(new Error('Supabase not configured')),
      delete: () => Promise.reject(new Error('Supabase not configured'))
    }),
    storage: {
      from: () => ({
        upload: () => Promise.reject(new Error('Supabase not configured')),
        getPublicUrl: () => ({ data: { publicUrl: '' } })
      })
    },
    channel: () => ({
      on: () => ({ subscribe: () => {} }),
      subscribe: () => {}
    })
  };
} else {
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
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
}

export const supabase = supabaseClient;

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