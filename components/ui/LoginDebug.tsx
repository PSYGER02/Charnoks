import React, { useState } from 'react';
import { supabase } from '../../src/supabaseConfig';

export const LoginDebug: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Only show in development
  if (import.meta.env.MODE !== 'development') {
    return null;
  }

  const runDiagnostics = async () => {
    setLoading(true);
    const results: any = {
      timestamp: new Date().toISOString(),
      tests: {}
    };

    try {
      // Test 1: Check Supabase connection
      results.tests.supabaseConnection = {
        name: 'Supabase Connection',
        status: 'testing...'
      };

      try {
        const { data, error } = await supabase.from('user_profiles').select('count').limit(1);
        results.tests.supabaseConnection = {
          name: 'Supabase Connection',
          status: error ? 'failed' : 'success',
          details: error ? error.message : 'Connected successfully'
        };
      } catch (err: any) {
        results.tests.supabaseConnection = {
          name: 'Supabase Connection',
          status: 'failed',
          details: err.message
        };
      }

      // Test 2: Check if user_profiles table exists
      results.tests.userProfilesTable = {
        name: 'User Profiles Table',
        status: 'testing...'
      };

      try {
        const { data, error } = await supabase.from('user_profiles').select('*').limit(1);
        results.tests.userProfilesTable = {
          name: 'User Profiles Table',
          status: error ? 'failed' : 'success',
          details: error ? error.message : `Table exists, found ${data?.length || 0} records`
        };
      } catch (err: any) {
        results.tests.userProfilesTable = {
          name: 'User Profiles Table',
          status: 'failed',
          details: err.message
        };
      }

      // Test 3: Check current session
      results.tests.currentSession = {
        name: 'Current Session',
        status: 'testing...'
      };

      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        results.tests.currentSession = {
          name: 'Current Session',
          status: session ? 'success' : 'none',
          details: session ? `User: ${session.user.email}` : 'No active session'
        };
      } catch (err: any) {
        results.tests.currentSession = {
          name: 'Current Session',
          status: 'failed',
          details: err.message
        };
      }

      // Test 4: Try to create a test user (signup)
      results.tests.testSignup = {
        name: 'Test Signup',
        status: 'testing...'
      };

      const testEmail = `test-${Date.now()}@example.com`;
      try {
        const { data, error } = await supabase.auth.signUp({
          email: testEmail,
          password: 'testpassword123',
          options: {
            data: {
              display_name: 'Test User',
              role: 'owner'
            }
          }
        });

        results.tests.testSignup = {
          name: 'Test Signup',
          status: error ? 'failed' : 'success',
          details: error ? error.message : `Test user created: ${testEmail}`
        };

        // If signup worked, try to clean up
        if (data.user && !error) {
          try {
            await supabase.auth.admin.deleteUser(data.user.id);
          } catch (cleanupErr) {
            // Ignore cleanup errors
          }
        }
      } catch (err: any) {
        results.tests.testSignup = {
          name: 'Test Signup',
          status: 'failed',
          details: err.message
        };
      }

    } catch (err: any) {
      results.error = err.message;
    }

    setDebugInfo(results);
    setLoading(false);
  };

  const testLogin = async () => {
    setLoading(true);
    try {
      // Try to login with demo credentials
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'owner@charnoks.com',
        password: 'password'
      });

      if (error) {
        setDebugInfo({
          loginTest: {
            status: 'failed',
            error: error.message,
            suggestion: 'Demo user does not exist. Try creating an account first.'
          }
        });
      } else {
        setDebugInfo({
          loginTest: {
            status: 'success',
            user: data.user.email,
            suggestion: 'Login works! Check if user profile exists.'
          }
        });
      }
    } catch (err: any) {
      setDebugInfo({
        loginTest: {
          status: 'error',
          error: err.message
        }
      });
    }
    setLoading(false);
  };

  return (
    <div className="fixed top-4 left-4 bg-gray-900/95 text-white p-4 rounded-lg text-xs font-mono max-w-lg z-50 max-h-96 overflow-y-auto">
      <h3 className="font-bold mb-2 text-yellow-400">🔍 Login Debug Panel</h3>
      
      <div className="space-y-2 mb-4">
        <button
          onClick={runDiagnostics}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-white text-xs"
        >
          {loading ? '⏳ Running...' : '🔍 Run Diagnostics'}
        </button>
        
        <button
          onClick={testLogin}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-white text-xs ml-2"
        >
          {loading ? '⏳ Testing...' : '🔑 Test Demo Login'}
        </button>
      </div>

      {debugInfo && (
        <div className="space-y-2">
          {debugInfo.tests && Object.values(debugInfo.tests).map((test: any, index) => (
            <div key={index} className="border-l-2 border-gray-600 pl-2">
              <div className="flex items-center space-x-2">
                <span className={
                  test.status === 'success' ? 'text-green-400' :
                  test.status === 'failed' ? 'text-red-400' :
                  test.status === 'none' ? 'text-yellow-400' :
                  'text-gray-400'
                }>
                  {test.status === 'success' ? '✅' :
                   test.status === 'failed' ? '❌' :
                   test.status === 'none' ? '⚠️' : '⏳'}
                </span>
                <span className="text-white font-medium">{test.name}</span>
              </div>
              <div className="text-gray-300 text-xs mt-1 ml-6">
                {test.details}
              </div>
            </div>
          ))}

          {debugInfo.loginTest && (
            <div className="border-l-2 border-blue-600 pl-2 mt-4">
              <div className="text-blue-400 font-medium">Login Test Result:</div>
              <div className={`text-xs mt-1 ${
                debugInfo.loginTest.status === 'success' ? 'text-green-400' : 'text-red-400'
              }`}>
                Status: {debugInfo.loginTest.status}
              </div>
              {debugInfo.loginTest.error && (
                <div className="text-red-300 text-xs">Error: {debugInfo.loginTest.error}</div>
              )}
              {debugInfo.loginTest.user && (
                <div className="text-green-300 text-xs">User: {debugInfo.loginTest.user}</div>
              )}
              {debugInfo.loginTest.suggestion && (
                <div className="text-yellow-300 text-xs">💡 {debugInfo.loginTest.suggestion}</div>
              )}
            </div>
          )}

          {debugInfo.error && (
            <div className="text-red-400 text-xs">
              Global Error: {debugInfo.error}
            </div>
          )}
        </div>
      )}
    </div>
  );
};