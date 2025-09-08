/**
 * Enhanced Data Loading Hook
 * Provides robust data loading with error handling, retry logic, and caching
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { LoadingState, APIError } from '../utils/errorTypes';
import { RetryManager } from '../utils/retryManager';
import { APIErrorHandler } from '../utils/enhancedErrorHandler';

interface UseEnhancedDataLoadingOptions<T> {
  initialData?: T | null;
  maxRetries?: number;
  retryDelay?: number;
  cacheKey?: string;
  cacheDuration?: number; // in milliseconds
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
  onError?: (error: APIError) => void;
  onSuccess?: (data: T) => void;
}

interface UseEnhancedDataLoadingResult<T> {
  loadingState: LoadingState<T>;
  reload: () => Promise<void>;
  refresh: () => Promise<void>;
  clearError: () => void;
  isStale: boolean;
}

// Simple in-memory cache
const dataCache = new Map<string, { data: any; timestamp: number; }>();

export function useEnhancedDataLoading<T>(
  loadFunction: () => Promise<T>,
  options: UseEnhancedDataLoadingOptions<T> = {}
): UseEnhancedDataLoadingResult<T> {
  const {
    initialData = null,
    maxRetries = 3,
    retryDelay = 1000,
    cacheKey,
    cacheDuration = 5 * 60 * 1000, // 5 minutes
    autoRefresh = false,
    refreshInterval = 30 * 1000, // 30 seconds
    onError,
    onSuccess
  } = options;

  const [loadingState, setLoadingState] = useState<LoadingState<T>>({
    data: initialData,
    loading: false,
    error: null,
    lastUpdated: null,
    retryCount: 0
  });

  const loadFunctionRef = useRef(loadFunction);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  // Update function ref when it changes
  useEffect(() => {
    loadFunctionRef.current = loadFunction;
  }, [loadFunction]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  // Check if cached data is available and fresh
  const getCachedData = useCallback((): T | null => {
    if (!cacheKey) return null;

    const cached = dataCache.get(cacheKey);
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > cacheDuration;
    return isExpired ? null : cached.data;
  }, [cacheKey, cacheDuration]);

  // Cache data
  const setCachedData = useCallback((data: T) => {
    if (cacheKey) {
      dataCache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
    }
  }, [cacheKey]);

  // Check if data is stale
  const isStale = useCallback((): boolean => {
    if (!loadingState.lastUpdated) return true;
    return Date.now() - loadingState.lastUpdated.getTime() > cacheDuration;
  }, [loadingState.lastUpdated, cacheDuration]);

  // Load data with retry logic
  const loadData = useCallback(async (isRetry: boolean = false) => {
    if (!mountedRef.current) return;

    // Check cache first (only for initial load, not retries)
    if (!isRetry) {
      const cachedData = getCachedData();
      if (cachedData) {
        setLoadingState(prev => ({
          ...prev,
          data: cachedData,
          loading: false,
          error: null,
          lastUpdated: new Date(),
          retryCount: 0
        }));

        if (onSuccess) {
          onSuccess(cachedData);
        }
        return;
      }
    }

    setLoadingState(prev => ({
      ...prev,
      loading: true,
      error: isRetry ? prev.error : null
    }));

    try {
      const result = await RetryManager.withRetry(
        () => loadFunctionRef.current(),
        {
          maxAttempts: maxRetries,
          baseDelay: retryDelay,
          maxDelay: 30000,
          backoffFactor: 2
        },
        {
          operation: cacheKey || 'data-loading',
          userId: 'current-user'
        }
      );

      if (!mountedRef.current) return;

      // Cache the result
      setCachedData(result);

      setLoadingState(prev => ({
        ...prev,
        data: result,
        loading: false,
        error: null,
        lastUpdated: new Date(),
        retryCount: 0
      }));

      if (onSuccess) {
        onSuccess(result);
      }

    } catch (error: any) {
      if (!mountedRef.current) return;

      const apiError = APIErrorHandler.handle(error, {
        operation: cacheKey || 'data-loading',
        userId: 'current-user'
      });

      setLoadingState(prev => ({
        ...prev,
        loading: false,
        error: apiError,
        retryCount: prev.retryCount + 1
      }));

      if (onError) {
        onError(apiError);
      }
    }
  }, [getCachedData, setCachedData, maxRetries, retryDelay, cacheKey, onSuccess, onError]);

  // Reload function (clears cache and reloads)
  const reload = useCallback(async () => {
    if (cacheKey) {
      dataCache.delete(cacheKey);
    }
    await loadData(false);
  }, [loadData, cacheKey]);

  // Refresh function (reloads without clearing cache)
  const refresh = useCallback(async () => {
    await loadData(false);
  }, [loadData]);

  // Clear error function
  const clearError = useCallback(() => {
    setLoadingState(prev => ({
      ...prev,
      error: null,
      retryCount: 0
    }));
  }, []);

  // Setup auto-refresh
  useEffect(() => {
    if (!autoRefresh || !refreshInterval) return;

    const setupAutoRefresh = () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }

      refreshTimeoutRef.current = setTimeout(() => {
        if (mountedRef.current && !loadingState.loading) {
          refresh();
        }
        setupAutoRefresh(); // Schedule next refresh
      }, refreshInterval);
    };

    setupAutoRefresh();

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [autoRefresh, refreshInterval, loadingState.loading, refresh]);

  // Initial load
  useEffect(() => {
    loadData(false);
  }, []); // Only run once on mount

  return {
    loadingState,
    reload,
    refresh,
    clearError,
    isStale: isStale()
  };
}

// Utility hook for simple data loading without advanced features
export function useSimpleDataLoading<T>(
  loadFunction: () => Promise<T>,
  dependencies: any[] = []
): UseEnhancedDataLoadingResult<T> {
  return useEnhancedDataLoading(loadFunction, {
    maxRetries: 2,
    retryDelay: 1000
  });
}

// Hook for data that should be cached and auto-refreshed
export function useCachedDataLoading<T>(
  loadFunction: () => Promise<T>,
  cacheKey: string,
  options: Partial<UseEnhancedDataLoadingOptions<T>> = {}
): UseEnhancedDataLoadingResult<T> {
  return useEnhancedDataLoading(loadFunction, {
    cacheKey,
    cacheDuration: 5 * 60 * 1000, // 5 minutes
    autoRefresh: true,
    refreshInterval: 60 * 1000, // 1 minute
    maxRetries: 3,
    ...options
  });
}

// Clear all cached data (useful for logout or data invalidation)
export function clearAllCache(): void {
  dataCache.clear();
}

// Clear specific cache entry
export function clearCache(key: string): void {
  dataCache.delete(key);
}

// Get cache statistics
export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: dataCache.size,
    keys: Array.from(dataCache.keys())
  };
}