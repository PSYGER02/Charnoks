import React from 'react';

interface LoadingScreenProps {
  message?: string;
  submessage?: string;
  type?: 'auth' | 'api' | 'data' | 'general';
  fullScreen?: boolean;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = 'Loading...', 
  submessage,
  type = 'general',
  fullScreen = true 
}) => {
  const getIcon = () => {
    switch (type) {
      case 'auth':
        return '🔐';
      case 'api':
        return '🌐';
      case 'data':
        return '📊';
      default:
        return '⚡';
    }
  };

  const getGradient = () => {
    switch (type) {
      case 'auth':
        return 'from-blue-500 to-purple-600';
      case 'api':
        return 'from-green-500 to-teal-600';
      case 'data':
        return 'from-orange-500 to-red-600';
      default:
        return 'from-yellow-500 to-orange-600';
    }
  };

  return (
    <div className={`${fullScreen ? 'fixed inset-0' : 'relative w-full'} z-50 flex items-center justify-center bg-black bg-opacity-40`}>
      <div className="flex flex-col items-center space-y-4">
        <div className={`w-16 h-16 rounded-xl flex items-center justify-center bg-gradient-to-br ${getGradient()} shadow-lg p-3`}>
          <span className="text-2xl drop-shadow-lg" role="img" aria-label={type}>{getIcon()}</span>
        </div>
        <div className="text-center space-y-2">
          <div className="text-lg font-semibold text-white drop-shadow-lg">{message}</div>
          {submessage && (
            <div className="text-sm text-white/70">{submessage}</div>
          )}
        </div>
      </div>
    </div>
  );
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