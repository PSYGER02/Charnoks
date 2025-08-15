import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../src/supabaseConfig';
import type { User, Session } from '@supabase/supabase-js';

export interface UserData {
  uid: string;
  email: string | null;
  role: 'owner' | 'worker';
  displayName: string;
}

interface AuthContextType {
  user: UserData | null;
  loading: boolean;
  signup: (name: string, email: string, password: string) => Promise<UserData>;
  login: (email: string, password: string) => Promise<UserData>;
  logout: () => Promise<void>;
  createWorkerAccount: (name: string, email: string, password: string) => Promise<UserData>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if Supabase is configured
  const isSupabaseConfigured = import.meta.env.VITE_SUPABASE_URL && 
                               import.meta.env.VITE_SUPABASE_ANON_KEY &&
                               import.meta.env.VITE_SUPABASE_URL !== 'undefined' &&
                               import.meta.env.VITE_SUPABASE_ANON_KEY !== 'undefined';

  useEffect(() => {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel environment variables.');
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        handleUserSession(session.user);
      } else {
        setLoading(false);
      }
    }).catch((error) => {
      console.error('Error getting session:', error);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          await handleUserSession(session.user);
        } else {
          setUser(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [isSupabaseConfigured]);

  const handleUserSession = async (authUser: User) => {
    try {
      // Get or create user profile
      let { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error && error.code === 'PGRST116') {
        // Profile doesn't exist, create it
        const { data: newProfile, error: createError } = await supabase
          .from('user_profiles')
          .insert({
            id: authUser.id,
            email: authUser.email,
            display_name: authUser.user_metadata?.display_name || authUser.email?.split('@')[0] || 'User',
            role: 'owner' // Default to owner for new signups
          })
          .select()
          .single();

        if (createError) throw createError;
        profile = newProfile;
      } else if (error) {
        throw error;
      }

      setUser({
        uid: authUser.id,
        email: authUser.email,
        role: profile?.role || 'owner',
        displayName: profile?.display_name || authUser.email?.split('@')[0] || 'User'
      });
    } catch (error) {
      console.error('Error handling user session:', error);
      // Fallback user data
      setUser({
        uid: authUser.id,
        email: authUser.email,
        role: 'owner',
        displayName: authUser.email?.split('@')[0] || 'User'
      });
    } finally {
      setLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string): Promise<UserData> => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase not configured. Please set environment variables.');
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: name
          }
        }
      });

      if (error) throw error;
      if (!data.user) throw new Error('No user returned from signup');

      // Create user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: data.user.id,
          email,
          display_name: name,
          role: 'worker'
        })

      if (profileError) throw profileError;

      return {
        uid: data.user.id,
        email: data.user.email,
        role: 'owner',
        displayName: name
      };
    } catch (error: any) {
      console.error('Signup error:', error);
      throw new Error(error.message || 'Failed to create account');
    }
  };

  const login = async (email: string, password: string): Promise<UserData> => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase not configured. Please set environment variables.');
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      if (!data.user) throw new Error('No user returned from login');

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError) throw profileError;

      return {
        uid: data.user.id,
        email: data.user.email,
        role: profile.role,
        displayName: profile.display_name || data.user.email?.split('@')[0] || 'User'
      };
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.message || 'Failed to log in');
    }
  };

  const logout = async (): Promise<void> => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase not configured. Please set environment variables.');
    }

    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error: any) {
      console.error('Logout error:', error);
      throw new Error(error.message || 'Failed to log out');
    }
  };

  const createWorkerAccount = async (name: string, email: string, password: string): Promise<UserData> => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase not configured. Please set environment variables.');
    }

    try {
      // Check if current user is owner
      if (!user || user.role !== 'owner') {
        throw new Error('Only owners can create worker accounts');
      }

      // Create auth user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: name
          }
        }
      });

      if (error) throw error;
      if (!data.user) throw new Error('No user returned from signup');

      // Create worker profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: data.user.id,
          email,
          display_name: name,
          role: 'worker'
        });

      if (profileError) throw profileError;

      return {
        uid: data.user.id,
        email: data.user.email,
        role: 'worker',
        displayName: name
      };
    } catch (error: any) {
      console.error('Create worker error:', error);
      throw new Error(error.message || 'Failed to create worker account');
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signup,
    login,
    logout,
    createWorkerAccount,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}