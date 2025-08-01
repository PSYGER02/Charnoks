/**
 * Loading State Manager Component
 * Provides consistent loading states with error handling and retry functionality
 */

import React from 'react';
import { LoadingState, APIError } from '../../utils/errorTypes';
import Spinner from './Spinner';

interface LoadingStateManagerProps<T> {
  loadingState: LoadingState<T>;
  onRetry?: () => void;
  onRefresh?: () => void;
  emptyStateMessage?: string;
  emptyStateAction?: {
    label: string;
    onClick: () => void;
  };
  children: (data: T) => React.ReactNode;
  className?: string;
}

function LoadingStateManager<T>({
  loadingState,
  onRetry,
  onRefresh,
  emptyStateMessage = "No data available",
  emptyStateAction,
  children,
  className = ""
}: LoadingStateManagerProps<T>) {
  const { data, loading, error, lastUpdated, retryCount } = loadingState;

  // Loading state
  if (loading && !data) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-[200px] ${className}`}>
        <Spinner size="lg" />
        <p className="text-text-secondary mt-4">Loading...</p>
        {retryCount > 0 && (
          <p className="text-text-secondary/70 text-sm mt-2">
            Retry attempt: {retryCount}
          </p>
        )}
      </div>
    );
  }

  // Error state
  if (error && !data) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-[200px] p-6 ${className}`}>
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6 max-w-md w-full text-center">
          <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-400 text-2xl">⚠️</span>
          </div>
          
          <h3 className="text-lg font-semibold text-red-300 mb-2">
            {error.severity === 'critical' ? 'Critical Error' : 'Something went wrong'}
          </h3>
          
          <p className="text-red-200 mb-4">{error.message}</p>
          
          {error.code && (
            <p className="text-red-400/70 text-sm mb-4">Error Code: {error.code}</p>
          )}

          {retryCount > 0 && (
            <p className="text-red-300/70 text-sm mb-4">
              Failed after {retryCount} attempts
            </p>
          )}

          <div className="flex gap-3 justify-center">
            {onRetry && error.retryable && (
              <button
                onClick={onRetry}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
              >
                Try Again
              </button>
            )}
            
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
              >
                Refresh
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (!loading && !error && (!data || (Array.isArray(data) && data.length === 0))) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-[200px] p-6 ${className}`}>
        <div className="bg-card-bg/80 backdrop-blur-sm rounded-lg p-6 max-w-md w-full text-center border border-border/50">
          <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-primary text-2xl">📭</span>
          </div>
          
          <h3 className="text-lg font-semibold text-text-primary mb-2">No Data Found</h3>
          <p className="text-text-secondary mb-4">{emptyStateMessage}</p>
          
          {emptyStateAction && (
            <button
              onClick={emptyStateAction.onClick}
              className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
            >
              {emptyStateAction.label}
            </button>
          )}

          {onRefresh && !emptyStateAction && (
            <button
              onClick={onRefresh}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
            >
              Refresh
            </button>
          )}
        </div>
      </div>
    );
  }

  // Success state with data
  if (data) {
    return (
      <div className={className}>
        {/* Loading overlay for refresh */}
        {loading && (
          <div className="relative">
            <div className="absolute top-0 right-0 z-10 bg-card-bg/90 backdrop-blur-sm rounded-lg p-2 border border-border/50">
              <div className="flex items-center text-sm text-text-secondary">
                <Spinner size="sm" className="mr-2" />
                Updating...
              </div>
            </div>
          </div>
        )}

        {/* Error banner for partial failures */}
        {error && (
          <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-yellow-400 mr-2">⚠️</span>
                <div>
                  <p className="text-yellow-300 text-sm font-medium">
                    Data may be outdated
                  </p>
                  <p className="text-yellow-400/80 text-xs">
                    {error.message}
                  </p>
                </div>
              </div>
              
              {onRetry && error.retryable && (
                <button
                  onClick={onRetry}
                  className="bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-300 px-3 py-1 rounded text-xs transition-colors"
                >
                  Retry
                </button>
              )}
            </div>
          </div>
        )}

        {/* Last updated indicator */}
        {lastUpdated && (
          <div className="flex justify-between items-center mb-4 text-xs text-text-secondary">
            <span>Last updated: {new Date(lastUpdated).toLocaleString()}</span>
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="hover:text-text-primary transition-colors"
                disabled={loading}
              >
                🔄 Refresh
              </button>
            )}
          </div>
        )}

        {/* Render children with data */}
        {children(data)}
      </div>
    );
  }

  // Fallback state
  return (
    <div className={`flex items-center justify-center min-h-[200px] ${className}`}>
      <p className="text-text-secondary">Unable to load data</p>
    </div>
  );
}

export default LoadingStateManager;