import React from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
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

  // Robust Supabase config validation
  const isSupabaseConfigured = 
    typeof import.meta.env.VITE_SUPABASE_URL === 'string' && 
    import.meta.env.VITE_SUPABASE_URL.length > 0 &&
    import.meta.env.VITE_SUPABASE_URL !== 'undefined' &&
    typeof import.meta.env.VITE_SUPABASE_ANON_KEY === 'string' && 
    import.meta.env.VITE_SUPABASE_ANON_KEY.length > 0 &&
    import.meta.env.VITE_SUPABASE_ANON_KEY !== 'undefined';

  useEffect(() => {
    // FORCE loading to false after 2 seconds to prevent infinite loading
    const forceTimeout = setTimeout(() => {
      if (loading) {
        console.warn('Auth timeout - forcing login redirect');
        setLoading(false);
      }
    }, 2000);

    if (!isSupabaseConfigured) {
      setLoading(false);
      clearTimeout(forceTimeout);
      return;
    }

    // Get initial session with timeout
    Promise.race([
      supabase.auth.getSession(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Session timeout')), 3000))
    ]).then(({ data: { session } }: any) => {
      if (session?.user) {
        handleUserSession(session.user);
      } else {
        setLoading(false);
      }
    }).catch(() => {
      setLoading(false);
    }).finally(() => {
      clearTimeout(forceTimeout);
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

    return () => {
      subscription.unsubscribe();
      clearTimeout(forceTimeout);
    };
  }, [isSupabaseConfigured]);

  const handleUserSession = async (authUser: User) => {
    // ALWAYS set user immediately to prevent white pages
    const fallbackUser = {
      uid: authUser.id,
      email: authUser.email,
      role: 'owner' as const,
      displayName: authUser.email?.split('@')[0] || 'User'
    };
    
    setUser(fallbackUser);
    setLoading(false);

    // Try to get profile in background (non-blocking) - simplified
    supabase.from('user_profiles')
      .select('*')
      .eq('id', authUser.id)
      .single()
      .then(({ data: profile, error }) => {
        if (profile) {
          setUser({
            uid: authUser.id,
            email: authUser.email,
            role: profile.role || 'owner',
            displayName: profile.display_name || fallbackUser.displayName
          });
        } else if (error?.code === 'PGRST116') {
          // Create profile if missing
          supabase.from('user_profiles').insert({
            id: authUser.id,
            email: authUser.email,
            display_name: fallbackUser.displayName,
            role: 'owner'
          }).then(() => setUser(fallbackUser)).catch(() => {});
        }
      })
      .catch(() => {}); // Silent fail, keep fallback user
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
            display_name: name,
            full_name: name,
            role: 'owner' // Set role in metadata for trigger
          }
        }
      });

      if (error) throw error;
      if (!data.user) throw new Error('No user returned from signup');

      // The trigger will automatically create the profile
      // Wait a moment for the trigger to complete
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Get the created profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        const { safeLog } = require('../utils/securityUtils');
        safeLog.warn('Profile not found, creating manually', profileError.message);
        // Fallback: create profile manually if trigger failed
        const { data: newProfile, error: createError } = await supabase
          .from('user_profiles')
          .insert({
            id: data.user.id,
            email,
            display_name: name,
            role: 'owner'
          })
          .select()
          .single();

        if (createError) throw createError;

        return {
          uid: data.user.id,
          email: data.user.email,
          role: 'owner',
          displayName: name
        };
      }

      return {
        uid: data.user.id,
        email: data.user.email,
        role: profile.role,
        displayName: profile.display_name
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

      if (profileError) {
        const { safeLog } = require('../utils/securityUtils');
        safeLog.warn('Profile not found for existing user, creating it', profileError.message);
        // Create profile for existing user (like manually created Supabase users)
        const { data: newProfile, error: createError } = await supabase
          .from('user_profiles')
          .insert({
            id: data.user.id,
            email: data.user.email,
            display_name: data.user.email?.split('@')[0] || 'User',
            role: 'owner' // Default to owner for existing users
          })
          .select()
          .single();

        if (createError) {
          console.error('Failed to create profile for existing user:', createError);
          throw new Error('Account exists but profile creation failed. Please contact support.');
        }

        return {
          uid: data.user.id,
          email: data.user.email,
          role: 'owner',
          displayName: newProfile.display_name
        };
      }

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

      // Create worker account directly using Supabase auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: name,
            full_name: name,
            role: 'worker'
          },
          emailRedirectTo: undefined // Disable email confirmation
        }
      });

      if (error) throw error;
      if (!data.user) throw new Error('No user returned from signup');

      // Wait for trigger to create profile
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Manually create profile if trigger failed
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert({
          id: data.user.id,
          email,
          display_name: name,
          role: 'worker'
        });

      if (profileError) {
        const { safeLog } = require('../utils/securityUtils');
        safeLog.warn('Profile creation warning', profileError.message);
      }

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