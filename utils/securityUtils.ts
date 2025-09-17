/**
 * Security utilities for input sanitization and safe logging
 */

/**
 * Sanitize input for safe logging - prevents log injection attacks
 */
export const sanitizeForLog = (input: any): string => {
  if (input === null || input === undefined) return 'null';
  
  const str = String(input);
  return str
    .replace(/[\r\n\t]/g, ' ')  // Replace newlines and tabs with spaces
    .replace(/[<>&"']/g, (match) => {
      const entities = { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#x27;' };
      return entities[match] || match;
    })
    .substring(0, 500);         // Limit length to prevent log flooding
};

/**
 * Sanitize user input for display - prevents XSS
 */
export const sanitizeForDisplay = (input: string): string => {
  if (!input || typeof input !== 'string') return '';
  return input
    .replace(/[<>&"']/g, (match) => {
      const entities = { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#x27;' };
      return entities[match] || match;
    })
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim()
    .substring(0, 1000);
};

/**
 * Safe console logging that prevents injection
 */
export const safeLog = {
  info: (message: string, data?: any) => {
    console.log(`[INFO] ${sanitizeForLog(message)}`, data ? sanitizeForLog(data) : '');
  },
  warn: (message: string, data?: any) => {
    console.warn(`[WARN] ${sanitizeForLog(message)}`, data ? sanitizeForLog(data) : '');
  },
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${sanitizeForLog(message)}`, error ? sanitizeForLog(error) : '');
  }
};