// Error types for the application
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public severity: 'error' | 'warning' | 'info' = 'error',
    public recoverable: boolean = true
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// Authentication specific errors
export class AuthError extends AppError {
  constructor(message: string, code: string = 'AUTH_ERROR') {
    super(message, code, 'error', true);
    this.name = 'AuthError';
  }
}

// API specific errors
export class ApiError extends AppError {
  constructor(
    message: string,
    public statusCode: number,
    code: string = 'API_ERROR'
  ) {
    super(message, code, 'error', true);
    this.name = 'ApiError';
  }
}

// Configuration errors
export class ConfigError extends AppError {
  constructor(message: string, code: string = 'CONFIG_ERROR') {
    super(message, code, 'error', false);
    this.name = 'ConfigError';
  }
}

// Database errors
export class DatabaseError extends AppError {
  constructor(message: string, code: string = 'DB_ERROR') {
    super(message, code, 'error', true);
    this.name = 'DatabaseError';
  }
}

// Network errors
export class NetworkError extends AppError {
  constructor(message: string, code: string = 'NETWORK_ERROR') {
    super(message, code, 'error', true);
    this.name = 'NetworkError';
  }
}

// Error handlers
export function handleAuthError(error: unknown): AuthError {
  if (error instanceof AuthError) return error;
  const message = error instanceof Error ? error.message : 'Authentication failed';
  return new AuthError(message);
}

export function handleApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  const message = error instanceof Error ? error.message : 'API request failed';
  return new ApiError(message, 500);
}

export function handleDatabaseError(error: unknown): DatabaseError {
  if (error instanceof DatabaseError) return error;
  const message = error instanceof Error ? error.message : 'Database operation failed';
  return new DatabaseError(message);
}

// Error logging
export function logError(error: unknown, context?: Record<string, unknown>): void {
  const errorObject = error instanceof Error ? error : new Error(String(error));
  
  const logData = {
    name: errorObject.name,
    message: errorObject.message,
    stack: errorObject.stack,
    context,
    timestamp: new Date().toISOString(),
  };

  // Import secure logger
  const { secureLogger } = require('../utils/securityConfig');
  
  if (import.meta.env.DEV) {
    secureLogger.error('🚨 Error occurred', {
      name: errorObject.name,
      message: errorObject.message,
      context: context ? JSON.stringify(context) : undefined
    });
  } else {
    secureLogger.error('Production error', errorObject.message);
  }
}
