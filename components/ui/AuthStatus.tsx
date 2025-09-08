import React from 'react';
import { useAuth } from '../../hooks/useSupabaseAuth';

export const AuthStatus: React.FC = () => {
  const { user, loading, isAuthenticated } = useAuth();

  // Only show in development
  if (import.meta.env.MODE !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900/90 text-white p-4 rounded-lg text-xs font-mono max-w-sm z-50">
      <h3 className="font-bold mb-2">👤 Auth Status</h3>
      
      <div className="space-y-1">
        <div className="flex justify-between">
          <span className="text-gray-300">Loading:</span>
          <span className={loading ? 'text-yellow-400' : 'text-green-400'}>
            {loading ? '⏳ Yes' : '✅ No'}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-300">Authenticated:</span>
          <span className={isAuthenticated ? 'text-green-400' : 'text-red-400'}>
            {isAuthenticated ? '✅ Yes' : '❌ No'}
          </span>
        </div>
        
        {user && (
          <>
            <div className="flex justify-between">
              <span className="text-gray-300">Role:</span>
              <span className={user.role === 'owner' ? 'text-blue-400' : 'text-purple-400'}>
                {user.role === 'owner' ? '👑 Owner' : '👷 Worker'}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-300">Name:</span>
              <span className="text-green-400 truncate max-w-24">
                {user.displayName}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-300">Email:</span>
              <span className="text-green-400 truncate max-w-24">
                {user.email}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-300">UID:</span>
              <span className="text-gray-400 truncate max-w-24">
                {user.uid.slice(0, 8)}...
              </span>
            </div>
            
            <div className="mt-2 pt-2 border-t border-gray-700">
              <div className="text-xs text-gray-400">Expected Routes:</div>
              <div className="text-xs text-blue-300">
                {user.role === 'owner' ? '/owner/dashboard' : '/worker/dashboard'}
              </div>
            </div>
          </>
        )}
      </div>
      
      {!isAuthenticated && !loading && (
        <div className="mt-2 text-yellow-400 text-center">
          Not logged in
        </div>
      )}
    </div>
  );
};