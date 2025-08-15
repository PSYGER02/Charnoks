// Minimal enhanced error handler used across the app

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface APIError {
  message: string;
  code?: string;
  severity?: ErrorSeverity;
  retryable?: boolean;
  original?: any;
}

export interface ErrorState {
  lastError?: APIError;
  errorCount?: number;
}

export interface SystemError {
  component: string;
  detail: string;
}

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryableErrors?: string[];
}

export const APIErrorHandler = {
  handle(error: any, context?: { operation?: string; userId?: string }): APIError {
    if (!error) {
      return { message: 'Unknown error', severity: 'low', retryable: false };
    }

    if (typeof error === 'string') {
      return { message: error, severity: 'medium', retryable: false, original: error };
    }

    // If error already shaped
    if ((error as APIError).message) {
      return error as APIError;
    }

    // Map common patterns
    const apiError: APIError = {
      message: error.message || String(error) || 'An error occurred',
      code: error.code || undefined,
      severity: 'medium',
      retryable: false,
      original: error
    };

    // Simple heuristics
    const msg = (apiError.message || '').toLowerCase();
    if (msg.includes('timeout') || msg.includes('network') || msg.includes('tempor')) {
      apiError.retryable = true;
      apiError.severity = 'medium';
    }

    if (msg.includes('unauthor') || msg.includes('forbidden')) {
      apiError.severity = 'high';
      apiError.retryable = false;
    }

    if (msg.includes('fatal') || msg.includes('critical')) {
      apiError.severity = 'critical';
    }

    return apiError;
  }
};

export default APIErrorHandler;
