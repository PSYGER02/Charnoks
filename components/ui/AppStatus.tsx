import React, { useEffect } from 'react';
import { useAppStore } from '../stores/appStore';

export const AppStatus: React.FC = () => {
  const {
    isInitialized,
    isOnline,
    isLoading,
    envStatus,
    errors,
    initialize,
    clearError
  } = useAppStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (!isInitialized || isLoading) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <div className="bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg animate-pulse">
          Initializing...
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {/* Connection Status */}
      {!isOnline && (
        <div className="bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg">
          You are offline
        </div>
      )}

      {/* Environment Status */}
      {import.meta.env.DEV && (
        <div className="bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg space-y-1">
          <div>Environment Status:</div>
          <div className={envStatus.supabase ? 'text-green-400' : 'text-red-400'}>
            Supabase: {envStatus.supabase ? '✓' : '✗'}
          </div>
          <div className={envStatus.gemini ? 'text-green-400' : 'text-yellow-400'}>
            Gemini AI: {envStatus.gemini ? '✓' : '✗'}
          </div>
          <div className={envStatus.adminApi ? 'text-green-400' : 'text-yellow-400'}>
            Admin API: {envStatus.adminApi ? '✓' : '✗'}
          </div>
        </div>
      )}

      {/* Error Messages */}
      {errors.map(error => (
        <div
          key={error.id}
          className={`
            px-4 py-2 rounded-lg shadow-lg flex justify-between items-center
            ${error.severity === 'error' ? 'bg-red-500' : ''}
            ${error.severity === 'warning' ? 'bg-yellow-500' : ''}
            ${error.severity === 'info' ? 'bg-blue-500' : ''}
            text-white
          `}
        >
          <span>{error.message}</span>
          <button
            onClick={() => clearError(error.id)}
            className="ml-4 hover:text-gray-200"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
};

export default AppStatus;
