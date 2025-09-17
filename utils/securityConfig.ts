/**
 * Centralized Security Configuration
 * Addresses: Log Injection, XSS, Input Validation, Environment Security
 */

import DOMPurify from 'dompurify';

// Environment Variable Security
export const getSecureEnvVar = (key: string): string | undefined => {
  // Standardize environment variable access
  const envMap: Record<string, string> = {
    'GEMINI_API_KEY': process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '',
    'SUPABASE_URL': process.env.VITE_SUPABASE_URL || '',
    'SUPABASE_ANON_KEY': process.env.VITE_SUPABASE_ANON_KEY || '',
    'SUPABASE_SERVICE_KEY': process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  };
  
  return envMap[key] || process.env[key];
};

// Log Injection Prevention
export const sanitizeForLog = (input: any): string => {
  if (input === null || input === undefined) return '[null]';
  
  const str = String(input);
  return str
    .replace(/[\r\n\t]/g, ' ')     // Remove line breaks
    .replace(/[<>&"']/g, '')       // Remove HTML chars
    .replace(/\x00-\x1f/g, '')     // Remove control chars
    .substring(0, 200);            // Limit length
};

// XSS Prevention
export const sanitizeForDisplay = (input: string): string => {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['strong', 'em', 'br'],
    ALLOWED_ATTR: [],
    STRIP_COMMENTS: true,
    STRIP_CDATA_SECTIONS: true
  });
};

// Safe Logging System
export const secureLogger = {
  info: (message: string, data?: any) => {
    console.log(`[INFO] ${sanitizeForLog(message)}`, data ? sanitizeForLog(JSON.stringify(data)) : '');
  },
  warn: (message: string, data?: any) => {
    console.warn(`[WARN] ${sanitizeForLog(message)}`, data ? sanitizeForLog(JSON.stringify(data)) : '');
  },
  error: (message: string, error?: any) => {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[ERROR] ${sanitizeForLog(message)}`, sanitizeForLog(errorMsg));
  }
};

// Input Validation
export const validateInput = {
  email: (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
  phone: (phone: string): boolean => /^\+?[\d\s-()]{10,}$/.test(phone),
  currency: (amount: string): boolean => /^\d+(\.\d{1,2})?$/.test(amount),
  alphanumeric: (text: string): boolean => /^[a-zA-Z0-9\s]+$/.test(text)
};