import { useState, useCallback } from 'react';

interface ApiLoadingState {
  isLoading: boolean;
  error: string | null;
  data: any;
}

interface UseApiLoadingReturn<T> {
  loading: boolean;
  error: string | null;
  data: T | null;
  execute: (apiCall: () => Promise<T>) => Promise<T | null>;
  reset: () => void;
}

/**
 * Hook for managing API loading states with professional loading indicators
 */
export function useApiLoading<T = any>(): UseApiLoadingReturn<T> {
  const [state, setState] = useState<ApiLoadingState>({
    isLoading: false,
    error: null,
    data: null
  });

  const execute = useCallback(async (apiCall: () => Promise<T>): Promise<T | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const result = await apiCall();
      setState({ isLoading: false, error: null, data: result });
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setState({ isLoading: false, error: errorMessage, data: null });
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ isLoading: false, error: null, data: null });
  }, []);

  return {
    loading: state.isLoading,
    error: state.error,
    data: state.data,
    execute,
    reset
  };
}

/**
 * Hook for managing multiple API calls with loading states
 */
export function useMultipleApiLoading() {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  const executeWithKey = useCallback(async <T>(
    key: string, 
    apiCall: () => Promise<T>,
    onSuccess?: (data: T) => void,
    onError?: (error: string) => void
  ): Promise<T | null> => {
    setLoadingStates(prev => ({ ...prev, [key]: true }));
    setErrors(prev => ({ ...prev, [key]: null }));
    
    try {
      const result = await apiCall();
      setLoadingStates(prev => ({ ...prev, [key]: false }));
      if (onSuccess) onSuccess(result);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setLoadingStates(prev => ({ ...prev, [key]: false }));
      setErrors(prev => ({ ...prev, [key]: errorMessage }));
      if (onError) onError(errorMessage);
      return null;
    }
  }, []);

  const isLoading = (key: string) => loadingStates[key] || false;
  const getError = (key: string) => errors[key] || null;
  const isAnyLoading = Object.values(loadingStates).some(Boolean);

  return {
    executeWithKey,
    isLoading,
    getError,
    isAnyLoading,
    loadingStates,
    errors
  };
}