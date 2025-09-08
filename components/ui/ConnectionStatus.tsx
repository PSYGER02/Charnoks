import React, { useState, useEffect } from 'react';
import { InlineLoader } from './LoadingScreen';

interface ConnectionStatusProps {
  onRetry?: () => void;
  compact?: boolean;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ onRetry, compact = false }) => {
  const [isConnecting, setIsConnecting] = useState(true);
  const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'error'>('connecting');

  useEffect(() => {
    // Simulate connection check
    const checkConnection = async () => {
      setIsConnecting(true);
      setConnectionState('connecting');
      
      try {
        // Check if environment variables are available
        const hasSupabase = !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
        
        if (hasSupabase) {
          // Simulate connection delay for better UX
          await new Promise(resolve => setTimeout(resolve, 1500));
          setConnectionState('connected');
        } else {
          setConnectionState('error');
        }
      } catch (error) {
        setConnectionState('error');
      } finally {
        setIsConnecting(false);
      }
    };

    checkConnection();
  }, []);

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  if (compact) {
    return (
      <div className="flex items-center space-x-2 text-sm">
        {connectionState === 'connecting' && (
          <>
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
            <span className="text-yellow-400">Connecting...</span>
          </>
        )}
        {connectionState === 'connected' && (
          <>
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-green-400">Connected</span>
          </>
        )}
        {connectionState === 'error' && (
          <>
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-red-400">Connection Error</span>
          </>
        )}
      </div>
    );
  }

  if (connectionState === 'connected') {
    return null; // Don't show anything when connected
  }

  if (connectionState === 'connecting') {
    return (
      <div className="fixed top-4 right-4 z-50">
        <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-4 border border-gray-700 shadow-lg">
          <InlineLoader message="Establishing connection..." size="sm" />
        </div>
      </div>
    );
  }

  // Error state
  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div className="bg-red-900/20 backdrop-blur-sm rounded-lg p-4 border border-red-500/30 shadow-lg">
        <div className="flex items-start space-x-3">
          <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs">!</span>
          </div>
          <div className="flex-1">
            <h4 className="text-red-400 font-medium text-sm">Connection Issue</h4>
            <p className="text-red-300 text-xs mt-1">
              Unable to connect to services. Check your configuration.
            </p>
            <button
              onClick={handleRetry}
              className="mt-2 px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};