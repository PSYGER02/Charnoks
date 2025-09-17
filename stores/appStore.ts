import { create } from 'zustand';
import { validateEnv } from '../utils/envValidator';


interface AppState {
  // System Status
  isInitialized: boolean;
  isOnline: boolean;
  isLoading: boolean;
  
  // Configuration Status
  envStatus: {
    supabase: boolean;
    gemini: boolean;
    adminApi: boolean;
  };
  
  // Error State
  errors: Array<{
    id: string;
    message: string;
    severity: 'error' | 'warning' | 'info';
    timestamp: number;
  }>;
  
  // Actions
  initialize: () => Promise<void>;
  setOnline: (status: boolean) => void;
  setLoading: (status: boolean) => void;
  addError: (message: string, severity?: 'error' | 'warning' | 'info') => void;
  clearError: (id: string) => void;
  clearAllErrors: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  isInitialized: false,
  isOnline: navigator.onLine,
  isLoading: true,
  
  envStatus: {
    supabase: false,
    gemini: false,
    adminApi: false
  },
  
  errors: [],
  
  initialize: async () => {
    try {
      // Validate environment
      const envStatus = validateEnv();
      if (!envStatus.isValid) {
        envStatus.errors.forEach(error => {
          get().addError(error, 'error');
        });
      }
      
      // Set initial state
      set({
        isInitialized: true,
        isLoading: false,
        envStatus: {
          supabase: Boolean(envStatus.env?.VITE_SUPABASE_URL && envStatus.env?.VITE_SUPABASE_ANON_KEY),
          gemini: Boolean(envStatus.env?.GEMINI_API_KEY),
          adminApi: Boolean(envStatus.env?.SUPABASE_SERVICE_ROLE_KEY)
        }
      });
      
    } catch (error) {
      console.error('App initialization failed:', error);
      get().addError('Failed to initialize application');
      set({ isInitialized: true, isLoading: false });
    }
  },
  
  setOnline: (status: boolean) => set({ isOnline: status }),
  
  setLoading: (status: boolean) => set({ isLoading: status }),
  
  addError: (message: string, severity: 'error' | 'warning' | 'info' = 'error') => {
    const newError = {
      id: Math.random().toString(36).substring(7),
      message,
      severity,
      timestamp: Date.now()
    };
    
    set(state => ({
      errors: [...state.errors, newError]
    }));
    
    // Log errors in development with sanitization
    if (import.meta.env.DEV) {
      const sanitizedMessage = message.replace(/[\r\n\t]/g, ' ').substring(0, 200);
      console.error(`${severity.toUpperCase()}: ${sanitizedMessage}`);
    }
  },
  
  clearError: (id: string) => {
    set(state => ({
      errors: state.errors.filter(error => error.id !== id)
    }));
  },
  
  clearAllErrors: () => set({ errors: [] })
}));

// Set up online/offline listeners
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => useAppStore.getState().setOnline(true));
  window.addEventListener('offline', () => useAppStore.getState().setOnline(false));
}
