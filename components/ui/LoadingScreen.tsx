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

  const containerClass = fullScreen 
    ? 'fixed inset-0 z-50 flex items-center justify-center bg-gray-900/95 backdrop-blur-sm'
    : 'flex items-center justify-center p-8';

  return (
    <div className={containerClass}>
      <div className="text-center">
        {/* Animated Logo/Icon */}
        <div className="relative mb-8">
          <div className="w-20 h-20 mx-auto mb-4 relative">
            {/* Spinning Ring */}
            <div className={`absolute inset-0 rounded-full bg-gradient-to-r ${getGradient()} animate-spin`}>
              <div className="absolute inset-2 bg-gray-900 rounded-full"></div>
            </div>
            
            {/* Center Icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl animate-pulse">{getIcon()}</span>
            </div>
          </div>
          
          {/* Pulsing Dots */}
          <div className="flex justify-center space-x-2">
            <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${getGradient()} animate-bounce`} style={{ animationDelay: '0ms' }}></div>
            <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${getGradient()} animate-bounce`} style={{ animationDelay: '150ms' }}></div>
            <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${getGradient()} animate-bounce`} style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>

        {/* Loading Text */}
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-white animate-pulse">
            {message}
          </h2>
          {submessage && (
            <p className="text-gray-400 text-sm animate-pulse" style={{ animationDelay: '500ms' }}>
              {submessage}
            </p>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mt-6 w-64 mx-auto">
          <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
            <div className={`h-full bg-gradient-to-r ${getGradient()} animate-pulse`} 
                 style={{ 
                   width: '100%',
                   animation: 'loading-progress 2s ease-in-out infinite'
                 }}>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes loading-progress {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

// Compact loading component for inline use
export const InlineLoader: React.FC<{ message?: string; size?: 'sm' | 'md' | 'lg' }> = ({ 
  message = 'Loading...', 
  size = 'md' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className="flex items-center justify-center space-x-3 p-4">
      <div className={`${sizeClasses[size]} relative`}>
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 animate-spin">
          <div className="absolute inset-1 bg-gray-900 rounded-full"></div>
        </div>
      </div>
      <span className="text-gray-300 text-sm animate-pulse">{message}</span>
    </div>
  );
};

// Skeleton loader for content
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