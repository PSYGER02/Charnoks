import React from 'react';

export const EnvDebug: React.FC = () => {
  // Only show in development
  if (import.meta.env.MODE !== 'development') {
    return null;
  }

  const envVars = {
    'VITE_SUPABASE_URL': import.meta.env.VITE_SUPABASE_URL,
    'VITE_SUPABASE_ANON_KEY': import.meta.env.VITE_SUPABASE_ANON_KEY,
    'MODE': import.meta.env.MODE,
    'DEV': import.meta.env.DEV,
    'PROD': import.meta.env.PROD,
  };

  return (
    <div className="fixed bottom-4 left-4 bg-gray-900/90 text-white p-4 rounded-lg text-xs font-mono max-w-md z-50">
      <h3 className="font-bold mb-2">🔧 Environment Debug</h3>
      {Object.entries(envVars).map(([key, value]) => (
        <div key={key} className="flex justify-between">
          <span className="text-gray-300">{key}:</span>
          <span className={value ? 'text-green-400' : 'text-red-400'}>
            {value ? (key.includes('KEY') ? '✅ SET' : `✅ ${value}`) : '❌ MISSING'}
          </span>
        </div>
      ))}
    </div>
  );
};