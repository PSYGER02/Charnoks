import React from 'react';

// Original LoadingScreen code preserved for reference

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
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 ${fullScreen ? '' : 'rounded-lg shadow-lg p-8'}`}>
      <div className="flex flex-col items-center space-y-4">
        <div className={`w-16 h-16 flex items-center justify-center rounded-full bg-gradient-to-r ${getGradient()} animate-spin-slow text-4xl`}>
          {getIcon()}
        </div>
        <div className="text-lg font-semibold text-white drop-shadow-lg">{message}</div>
        {submessage && <div className="text-sm text-gray-200">{submessage}</div>}
        <div className="w-48 h-2 bg-gray-700 rounded-full overflow-hidden mt-2">
          <div className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 animate-loading-progress" style={{ width: '100%' }}></div>
        </div>
      </div>
      <style>{`
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
    sm: 'w-4 h-4 text-xs',
    md: 'w-6 h-6 text-base',
    lg: 'w-10 h-10 text-lg',
  };
  return (
    <div className={`flex items-center space-x-2 animate-pulse`}>
      <div className={`rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 ${sizeClasses[size]}`}></div>
      <span>{message}</span>
    </div>
  );
};

// Skeleton loader for content
export const SkeletonLoader: React.FC<{ lines?: number; className?: string }> = ({ 
  lines = 3, 
  className = '' 
}) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <div key={i} className="h-4 bg-gray-300 rounded w-full animate-pulse" />
    ))}
  </div>
);
