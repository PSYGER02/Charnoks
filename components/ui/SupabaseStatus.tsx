import React from 'react';

const SupabaseStatus: React.FC = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  const isConfigured = supabaseUrl && 
                      supabaseKey && 
                      supabaseUrl !== 'undefined' && 
                      supabaseKey !== 'undefined';

  if (isConfigured) {
    return null; // Don't show anything if properly configured
  }

  return (
    <div className="fixed top-0 left-0 right-0 bg-red-600 text-white p-3 z-50">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center">
          <span className="mr-3">⚠️</span>
          <div>
            <strong>Supabase Configuration Missing</strong>
            <p className="text-sm opacity-90">
              Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your Vercel environment variables.
            </p>
          </div>
        </div>
        <div className="text-sm">
          <div>URL: {supabaseUrl ? '✅' : '❌'}</div>
          <div>Key: {supabaseKey ? '✅' : '❌'}</div>
        </div>
      </div>
    </div>
  );
};

export default SupabaseStatus;