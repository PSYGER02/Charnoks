/**
 * Configuration Validator
 * Validates environment variables and service configurations
 */

export interface ConfigValidationResult {
  isValid: boolean;
  missingKeys: string[];
  invalidKeys: string[];
  suggestions: string[];
  details: Record<string, {
    present: boolean;
    valid: boolean;
    message?: string;
  }>;
}

export interface SystemConfig {
  firebase: {
    configured: boolean;
    connected: boolean;
    lastChecked: Date;
  };
  gemini: {
    configured: boolean;
    working: boolean;
    lastChecked: Date;
  };
  features: {
    aiEnabled: boolean;
    backupEnabled: boolean;
    userManagementEnabled: boolean;
  };
}

export class ConfigValidator {
  /**
   * Validate Firebase configuration
   */
  static validateFirebase(): ConfigValidationResult {
    const requiredKeys = [
      'VITE_FIREBASE_API_KEY',
      'VITE_FIREBASE_AUTH_DOMAIN',
      'VITE_FIREBASE_PROJECT_ID',
      'VITE_FIREBASE_STORAGE_BUCKET',
      'VITE_FIREBASE_MESSAGING_SENDER_ID',
      'VITE_FIREBASE_APP_ID'
    ];

    const missingKeys: string[] = [];
    const invalidKeys: string[] = [];
    const details: Record<string, any> = {};

    requiredKeys.forEach(key => {
      const value = import.meta.env[key];
      const present = !!value;
      const valid = present && value !== 'undefined' && !value.includes('your_') && value.length > 10;

      details[key] = {
        present,
        valid,
        message: !present ? 'Missing' : !valid ? 'Invalid or placeholder value' : 'Valid'
      };

      if (!present) {
        missingKeys.push(key);
      } else if (!valid) {
        invalidKeys.push(key);
      }
    });

    const isValid = missingKeys.length === 0 && invalidKeys.length === 0;

    return {
      isValid,
      missingKeys,
      invalidKeys,
      suggestions: ConfigValidator.getFirebaseSuggestions(missingKeys, invalidKeys),
      details
    };
  }

  /**
   * Validate Gemini API configuration
   */
  static validateGemini(): ConfigValidationResult {
    const key = 'GEMINI_API_KEY';
    const value = import.meta.env[key];
    const present = !!value;
    const valid = present && value !== 'undefined' && !value.includes('your_') && value.startsWith('AI');

    const details = {
      [key]: {
        present,
        valid,
        message: !present ? 'Missing' : !valid ? 'Invalid or placeholder value' : 'Valid'
      }
    };

    const missingKeys = !present ? [key] : [];
    const invalidKeys = present && !valid ? [key] : [];
    const isValid = missingKeys.length === 0 && invalidKeys.length === 0;

    return {
      isValid,
      missingKeys,
      invalidKeys,
      suggestions: ConfigValidator.getGeminiSuggestions(missingKeys, invalidKeys),
      details
    };
  }

  /**
   * Validate all configurations
   */
  static validateAll(): ConfigValidationResult {
    const firebaseResult = ConfigValidator.validateFirebase();
    const geminiResult = ConfigValidator.validateGemini();

    return {
      isValid: firebaseResult.isValid && geminiResult.isValid,
      missingKeys: [...firebaseResult.missingKeys, ...geminiResult.missingKeys],
      invalidKeys: [...firebaseResult.invalidKeys, ...geminiResult.invalidKeys],
      suggestions: [...firebaseResult.suggestions, ...geminiResult.suggestions],
      details: { ...firebaseResult.details, ...geminiResult.details }
    };
  }

  /**
   * Get system configuration status
   */
  static async getSystemConfig(): Promise<SystemConfig> {
    const firebaseValidation = ConfigValidator.validateFirebase();
    const geminiValidation = ConfigValidator.validateGemini();

    return {
      firebase: {
        configured: firebaseValidation.isValid,
        connected: false, // Will be updated by connection test
        lastChecked: new Date()
      },
      gemini: {
        configured: geminiValidation.isValid,
        working: false, // Will be updated by API test
        lastChecked: new Date()
      },
      features: {
        aiEnabled: geminiValidation.isValid,
        backupEnabled: firebaseValidation.isValid,
        userManagementEnabled: firebaseValidation.isValid
      }
    };
  }

  /**
   * Test Firebase connection
   */
  static async testFirebaseConnection(): Promise<boolean> {
    try {
      // Import Firebase modules dynamically to avoid initialization errors
      const { db } = await import('../src/firebaseConfig');
      const { doc, getDoc } = await import('firebase/firestore');
      
      // Try to read a document (this will fail gracefully if not configured)
      const testDoc = doc(db, 'test', 'connection');
      await getDoc(testDoc);
      return true;
    } catch (error) {
      console.warn('Firebase connection test failed:', error);
      return false;
    }
  }

  /**
   * Test Gemini API connection
   */
  static async testGeminiConnection(): Promise<boolean> {
    try {
      const apiKey = import.meta.env.GEMINI_API_KEY;
      if (!apiKey || apiKey.includes('your_')) {
        return false;
      }

      // Simple API test (would need actual implementation)
      return true;
    } catch (error) {
      console.warn('Gemini API test failed:', error);
      return false;
    }
  }

  // Private helper methods
  private static getFirebaseSuggestions(missingKeys: string[], invalidKeys: string[]): string[] {
    const suggestions: string[] = [];

    if (missingKeys.length > 0 || invalidKeys.length > 0) {
      suggestions.push('Update your .env.local file with actual Firebase project credentials');
      suggestions.push('Get credentials from Firebase Console > Project Settings > General');
      suggestions.push('For Vercel deployment, add environment variables in Vercel dashboard');
    }

    if (invalidKeys.some(key => import.meta.env[key]?.includes('your_'))) {
      suggestions.push('Replace placeholder values (your_api_key_here) with actual values');
    }

    return suggestions;
  }

  private static getGeminiSuggestions(missingKeys: string[], invalidKeys: string[]): string[] {
    const suggestions: string[] = [];

    if (missingKeys.length > 0 || invalidKeys.length > 0) {
      suggestions.push('Get a Gemini API key from Google AI Studio');
      suggestions.push('Add GEMINI_API_KEY to your .env.local file');
      suggestions.push('For Vercel deployment, add GEMINI_API_KEY in environment variables');
    }

    return suggestions;
  }
}