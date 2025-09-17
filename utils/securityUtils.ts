/**
 * Legacy security utilities - DEPRECATED
 * Use securityConfig.ts for new implementations
 */

import { sanitizeForLog, sanitizeForDisplay, secureLogger } from './securityConfig';

// Re-export for backward compatibility
export { sanitizeForLog, sanitizeForDisplay };
export const safeLog = secureLogger;