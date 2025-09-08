import React from 'react';
import { LoadingScreen, InlineLoader, SkeletonLoader } from './LoadingScreen';

interface LoadingWrapperProps {
  loading: boolean;
  error?: string | null;
  children: React.ReactNode;
  loadingType?: 'fullscreen' | 'inline' | 'skeleton';
  loadingMessage?: string;
  loadingSubmessage?: string;
  apiType?: 'auth' | 'api' | 'data' | 'general';
  skeletonLines?: number;
  onRetry?: () => void;
  emptyState?: React.ReactNode;
  isEmpty?: boolean;
}

export const LoadingWrapper: React.FC<LoadingWrapperProps> = ({
  loading,
  error,
  children,
  loadingType = 'inline',
  loadingMessage = 'Loading...',
  loadingSubmessage,
  apiType = 'general',
  skeletonLines = 3,
  onRetry,
  emptyState,
  isEmpty = false
}) => {
  // Show error state
  if (error && !loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
          <span className="text-red-400 text-2xl">⚠️</span>
        </div>
        <h3 className="text-red-400 font-semibold mb-2">Something went wrong</h3>
        <p className="text-gray-400 text-sm mb-4 max-w-md">{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium transition-colors"
          >
            Try Again
          </button>
        )}
      </div>
    );
  }

  // Show loading state
  if (loading) {
    switch (loadingType) {
      case 'fullscreen':
        return (
          <LoadingScreen
            message={loadingMessage}
            submessage={loadingSubmessage}
            type={apiType}
            fullScreen={true}
          />
        );
      case 'skeleton':
        return <SkeletonLoader lines={skeletonLines} className="p-4" />;
      case 'inline':
      default:
        return <InlineLoader message={loadingMessage} />;
    }
  }

  // Show empty state
  if (isEmpty && emptyState) {
    return <>{emptyState}</>;
  }

  // Show content
  return <>{children}</>;
};

// Specialized loading wrapper for data lists
export const DataLoadingWrapper: React.FC<{
  loading: boolean;
  error?: string | null;
  data: any[] | null;
  children: React.ReactNode;
  emptyMessage?: string;
  emptyIcon?: string;
  onRetry?: () => void;
  skeletonLines?: number;
}> = ({
  loading,
  error,
  data,
  children,
  emptyMessage = 'No data available',
  emptyIcon = '📭',
  onRetry,
  skeletonLines = 5
}) => {
  const isEmpty = !loading && !error && (!data || data.length === 0);

  const emptyState = (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <div className="w-20 h-20 bg-gray-700/30 rounded-full flex items-center justify-center mb-4">
        <span className="text-3xl">{emptyIcon}</span>
      </div>
      <h3 className="text-gray-400 font-medium mb-2">{emptyMessage}</h3>
      <p className="text-gray-500 text-sm">Get started by adding your first item</p>
    </div>
  );

  return (
    <LoadingWrapper
      loading={loading}
      error={error}
      loadingType="skeleton"
      skeletonLines={skeletonLines}
      onRetry={onRetry}
      isEmpty={isEmpty}
      emptyState={emptyState}
    >
      {children}
    </LoadingWrapper>
  );
};

// Specialized loading wrapper for API calls
export const ApiLoadingWrapper: React.FC<{
  loading: boolean;
  error?: string | null;
  children: React.ReactNode;
  apiName?: string;
  onRetry?: () => void;
}> = ({
  loading,
  error,
  children,
  apiName = 'API',
  onRetry
}) => {
  return (
    <LoadingWrapper
      loading={loading}
      error={error}
      loadingType="inline"
      loadingMessage={`Connecting to ${apiName}...`}
      loadingSubmessage="Please wait while we fetch your data"
      apiType="api"
      onRetry={onRetry}
    >
      {children}
    </LoadingWrapper>
  );
};