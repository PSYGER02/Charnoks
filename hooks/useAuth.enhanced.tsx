/**
 * Enhanced useAuth Hook
 * Uses the unified authentication service with better error handling
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, UserData } from '../services/authService.unified';
import { ErrorHandler, getUserFriendlyMessage } from '../utils/errorHandler';
import { performanceMonitor } from '../utils/monitoring';

/**
 * Authentication context interface
 */
interface AuthContextType {
  // State
  user: UserData | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  createWorkerAccount: (name: string, email: string, password: string) => Promise<UserData>;
  
  // Utilities
  isAuthenticated: boolean;
  hasRole: (role: 'owner' | 'worker') => boolean;
  refreshUserData: () => Promise<void>;
  clearError: () => void;
}

/**
 * Authentication context
 */
const AuthContext = createContext<AuthContextType | null>(null);

/**
 * Authentication provider component
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to auth state changes
  useEffect(() => {
    const unsubscribe = authService.subscribeToAuthState((newUser) => {
      setUser(newUser);
      setLoading(false);
      
      // Clear error when user state changes successfully
      if (newUser !== null) {
        setError(null);
      }
    });

    return unsubscribe;
  }, []);

  /**
   * Handle authentication errors consistently
   */
  const handleAuthError = (error: any, operation: string) => {
    const friendlyMessage = getUserFriendlyMessage(error);
    setError(friendlyMessage);
    
    performanceMonitor.logError(error, {
      operation,
      userId: user?.uid,
      userRole: user?.role
    });
  };

  /**
   * Sign in user
   */
  const signIn = async (email: string, password: string) => {
    const timerId = performanceMonitor.startTimer('auth_signin');
    setLoading(true);
    setError(null);

    try {
      const userData = await authService.signIn(email, password);
      setUser(userData);
      performanceMonitor.endTimer(timerId, true);
      
      performanceMonitor.logMetric('user_signin', 1, {
        userRole: userData.role,
        userId: userData.uid
      });
    } catch (error: any) {
      performanceMonitor.endTimer(timerId, false, error.message);
      handleAuthError(error, 'signIn');
      throw error; // Re-throw for component handling
    } finally {
      setLoading(false);
    }
  };

  /**
   * Sign up new user
   */
  const signUp = async (name: string, email: string, password: string) => {
    const timerId = performanceMonitor.startTimer('auth_signup');
    setLoading(true);
    setError(null);

    try {
      const userData = await authService.signUp(name, email, password);
      setUser(userData);
      performanceMonitor.endTimer(timerId, true);
      
      performanceMonitor.logMetric('user_signup', 1, {
        userRole: userData.role,
        userId: userData.uid
      });
    } catch (error: any) {
      performanceMonitor.endTimer(timerId, false, error.message);
      handleAuthError(error, 'signUp');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Sign out user
   */
  const signOut = async () => {
    const timerId = performanceMonitor.startTimer('auth_signout');
    setLoading(true);
    setError(null);

    try {
      await authService.signOut();
      setUser(null);
      performanceMonitor.endTimer(timerId, true);
      
      performanceMonitor.logMetric('user_signout', 1, {
        userId: user?.uid
      });
    } catch (error: any) {
      performanceMonitor.endTimer(timerId, false, error.message);
      handleAuthError(error, 'signOut');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Create worker account (owner only)
   */
  const createWorkerAccount = async (name: string, email: string, password: string): Promise<UserData> => {
    const timerId = performanceMonitor.startTimer('auth_create_worker');
    setError(null);

    try {
      const workerData = await authService.createWorkerAccount(name, email, password);
      performanceMonitor.endTimer(timerId, true);
      
      performanceMonitor.logMetric('worker_created', 1, {
        createdBy: user?.uid,
        workerEmail: email
      });
      
      return workerData;
    } catch (error: any) {
      performanceMonitor.endTimer(timerId, false, error.message);
      handleAuthError(error, 'createWorkerAccount');
      throw error;
    }
  };

  /**
   * Refresh user data
   */
  const refreshUserData = async () => {
    setError(null);
    
    try {
      const refreshedUser = await authService.refreshUserData();
      setUser(refreshedUser);
    } catch (error: any) {
      handleAuthError(error, 'refreshUserData');
    }
  };

  /**
   * Clear error state
   */
  const clearError = () => {
    setError(null);
  };

  /**
   * Check if user has specific role
   */
  const hasRole = (role: 'owner' | 'worker'): boolean => {
    return user?.role === role;
  };

  const contextValue: AuthContextType = {
    // State
    user,
    loading,
    error,
    
    // Actions
    signIn,
    signUp,
    signOut,
    createWorkerAccount,
    
    // Utilities
    isAuthenticated: user !== null,
    hasRole,
    refreshUserData,
    clearError
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to use authentication context
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

/**
 * Hook for role-based access control
 */
export function useRequireAuth(requiredRole?: 'owner' | 'worker') {
  const { user, loading, hasRole } = useAuth();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      setAuthorized(false);
      return;
    }

    if (requiredRole && !hasRole(requiredRole)) {
      setAuthorized(false);
      return;
    }

    setAuthorized(true);
  }, [user, loading, requiredRole, hasRole]);

  return {
    user,
    loading,
    authorized
  };
}

/**
 * Hook for protected routes
 */
export function useAuthGuard() {
  const { user, loading } = useAuth();
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      setShouldRedirect(true);
    } else {
      setShouldRedirect(false);
    }
  }, [user, loading]);

  return {
    user,
    loading,
    shouldRedirect
  };
}

/**
 * Higher-order component for role-based access
 */
export function withRoleGuard<P extends object>(
  Component: React.ComponentType<P>,
  requiredRole: 'owner' | 'worker'
) {
  return function GuardedComponent(props: P) {
    const { user, loading, authorized } = useRequireAuth(requiredRole);

    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (!authorized) {
      return (
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="text-gray-600">
            You don't have permission to access this page.
            {!user && ' Please log in to continue.'}
            {user && ` Required role: ${requiredRole}`}
          </p>
        </div>
      );
    }

    return <Component {...props} />;
  };
}

/**
 * Component for displaying authentication errors
 */
export function AuthErrorDisplay() {
  const { error, clearError } = useAuth();

  if (!error) return null;

  return (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
      <div className="flex justify-between items-center">
        <span>{error}</span>
        <button
          onClick={clearError}
          className="text-red-700 hover:text-red-900 font-bold"
        >
          ×
        </button>
      </div>
    </div>
  );
}

/**
 * Loading spinner component
 */
export function AuthLoadingSpinner() {
  return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );
}