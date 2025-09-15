import React from 'react';

interface LoadingScreenProps {
  message?: string;
  submessage?: string;
  type?: 'auth' | 'api' | 'data' | 'general';
  fullScreen?: boolean;
}

// DISABLED: Full-screen loading moved to PreservedLoadingScreen.tsx
// This component now returns null to prevent full-screen overlays
export const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = 'Loading...', 
  submessage,
  type = 'general',
  fullScreen = true 
}) => {
  // Return null to disable full-screen loading overlays
  return null;
};

export const SkeletonLoader: React.FC<{ lines?: number; className?: string }> = ({ 
  lines = 3, 
  className = '' 
}) => {
  return (
    <div className={`animate-pulse space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="flex space-x-4">
          <div className="rounded-full bg-gray-700 h-10 w-10"></div>
          <div className="flex-1 space-y-2 py-1">
            <div className="h-4 bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export const InlineLoader: React.FC<{
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}> = ({ message = 'Loading...', size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3'
  };

  return (
    <div className="flex items-center space-x-3">
      <div className={`${sizeClasses[size]} border-primary border-t-transparent rounded-full animate-spin`} />
      {message && (
        <span className="text-text-secondary">{message}</span>
      )}
    </div>
  );
};