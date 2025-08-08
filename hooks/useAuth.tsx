/** @jsxRuntime classic */
import React from 'react';
import { AuthProvider as EnhancedAuthProvider } from './useAuth.enhanced';
import { useAuth as useEnhancedAuth } from './useAuth.enhanced';
import type { UserData } from '../services/authService.unified';

// Backward-compatible wrapper over enhanced auth

type LegacyAuthContext = {
  user: UserData | null;
  loading: boolean;
  error: string | null;
  // Legacy method names preserved
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  createWorker: (name: string, email: string, password: string) => Promise<UserData>;
  // Extras exposed by enhanced auth
  isAuthenticated: boolean;
  hasRole: (role: 'owner' | 'worker') => boolean;
  refreshUserData: () => Promise<void>;
  clearError: () => void;
};

const LegacyAuthContext = React.createContext<LegacyAuthContext | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <EnhancedAuthProvider>
      <LegacyAuthAdapter>{children}</LegacyAuthAdapter>
    </EnhancedAuthProvider>
  );
}

function LegacyAuthAdapter({ children }: { children: React.ReactNode }) {
  const auth = useEnhancedAuth();

  const value: LegacyAuthContext = {
    user: auth.user,
    loading: auth.loading,
    error: auth.error,
    login: auth.signIn,
    signup: auth.signUp,
    logout: auth.signOut,
    createWorker: auth.createWorkerAccount,
    isAuthenticated: auth.isAuthenticated,
    hasRole: auth.hasRole,
    refreshUserData: auth.refreshUserData,
    clearError: auth.clearError,
  };

  // Expose legacy name as property on value for components that expect it
  (value as any).createWorkerAccount = auth.createWorkerAccount;

  return (
    <LegacyAuthContext.Provider value={value}>{children}</LegacyAuthContext.Provider>
  );
}

export function useAuth(): LegacyAuthContext {
  const ctx = React.useContext(LegacyAuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}