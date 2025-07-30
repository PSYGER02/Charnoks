/**
 * Centralized Error Handling System
 * Provides consistent error handling across the application
 */

export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public details?: any,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface AppErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface SuccessResponse<T> {
  success: true;
  data: T;
}

/**
 * Firebase error code to user-friendly message mapping
 */
const FIREBASE_ERROR_MESSAGES: Record<string, string> = {
  // Authentication errors
  'auth/user-not-found': 'Invalid email or password',
  'auth/wrong-password': 'Invalid email or password',
  'auth/invalid-email': 'Please enter a valid email address',
  'auth/user-disabled': 'This account has been disabled',
  'auth/too-many-requests': 'Too many failed attempts. Please try again later',
  'auth/email-already-in-use': 'An account with this email already exists',
  'auth/weak-password': 'Password should be at least 6 characters',
  'auth/network-request-failed': 'Network error. Please check your connection',
  
  // Firestore errors
  'permission-denied': 'You do not have permission to perform this action',
  'not-found': 'The requested data was not found',
  'already-exists': 'This item already exists',
  'invalid-argument': 'Invalid data provided',
  'unauthenticated': 'Please log in to continue',
  'failed-precondition': 'Operation failed due to current system state',
  'resource-exhausted': 'Service temporarily unavailable. Please try again',
  'deadline-exceeded': 'Request timed out. Please try again',
  'unavailable': 'Service temporarily unavailable',
  
  // Custom business logic errors
  'insufficient-stock': 'Not enough items in stock for this sale',
  'invalid-sale-data': 'Sale data is invalid or incomplete',
  'invalid-product-data': 'Product data is invalid or incomplete',
  'invalid-expense-data': 'Expense data is invalid or incomplete',
  'worker-creation-failed': 'Failed to create worker account',
  'role-assignment-failed': 'Failed to assign user role',
  'ai-service-unavailable': 'AI service is temporarily unavailable',
  'voice-parsing-failed': 'Could not understand the voice input',
};

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Error categories for better organization
 */
export enum ErrorCategory {
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  VALIDATION = 'validation',
  BUSINESS_LOGIC = 'business_logic',
  SYSTEM = 'system',
  NETWORK = 'network',
  AI_SERVICE = 'ai_service'
}

/**
 * Enhanced error information for logging
 */
export interface ErrorContext {
  userId?: string;
  operation?: string;
  timestamp: number;
  userAgent?: string;
  ip?: string;
  additionalData?: any;
}

/**
 * Centralized error handler class
 */
export class ErrorHandler {
  /**
   * Handle Firebase-specific errors
   */
  static handleFirebaseError(error: any, context?: Partial<ErrorContext>): AppError {
    const code = error.code || 'unknown-error';
    const message = FIREBASE_ERROR_MESSAGES[code] || error.message || 'An unexpected error occurred';
    
    const severity = ErrorHandler.getErrorSeverity(code);
    const category = ErrorHandler.getErrorCategory(code);
    
    const appError = new AppError(
      code,
      message,
      {
        originalError: error.message,
        severity,
        category,
        context
      },
      ErrorHandler.getStatusCode(code)
    );
    
    // Log error for debugging
    ErrorHandler.logError(appError, context);
    
    return appError;
  }

  /**
   * Handle validation errors
   */
  static handleValidationError(errors: ValidationError[], context?: Partial<ErrorContext>): AppError {
    const message = `Validation failed: ${errors.map(e => e.message).join(', ')}`;
    
    const appError = new AppError(
      'validation-failed',
      message,
      {
        validationErrors: errors,
        severity: ErrorSeverity.MEDIUM,
        category: ErrorCategory.VALIDATION,
        context
      },
      400
    );
    
    ErrorHandler.logError(appError, context);
    
    return appError;
  }

  /**
   * Handle general system errors
   */
  static handleSystemError(error: any, context?: Partial<ErrorContext>): AppError {
    const code = 'system-error';
    const message = 'An internal system error occurred';
    
    const appError = new AppError(
      code,
      message,
      {
        originalError: error.message,
        stack: error.stack,
        severity: ErrorSeverity.HIGH,
        category: ErrorCategory.SYSTEM,
        context
      },
      500
    );
    
    ErrorHandler.logError(appError, context);
    
    return appError;
  }

  /**
   * Handle business logic errors
   */
  static handleBusinessLogicError(
    code: string, 
    message: string, 
    details?: any, 
    context?: Partial<ErrorContext>
  ): AppError {
    const appError = new AppError(
      code,
      message,
      {
        ...details,
        severity: ErrorSeverity.MEDIUM,
        category: ErrorCategory.BUSINESS_LOGIC,
        context
      },
      400
    );
    
    ErrorHandler.logError(appError, context);
    
    return appError;
  }

  /**
   * Log error with context
   */
  static logError(error: AppError, context?: Partial<ErrorContext>): void {
    const logData = {
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
        stack: error.stack
      },
      context: {
        timestamp: Date.now(),
        ...context
      }
    };

    // In production, this would go to a logging service like Cloud Logging
    if (typeof window === 'undefined') {
      // Server-side logging
      console.error('[SERVER ERROR]', JSON.stringify(logData, null, 2));
    } else {
      // Client-side logging
      console.error('[CLIENT ERROR]', logData);
    }

    // TODO: Send to external logging service (e.g., Sentry, LogRocket)
    // this.sendToLoggingService(logData);
  }

  /**
   * Get error severity based on error code
   */
  private static getErrorSeverity(code: string): ErrorSeverity {
    const highSeverityErrors = [
      'permission-denied',
      'unauthenticated',
      'system-error',
      'resource-exhausted'
    ];
    
    const mediumSeverityErrors = [
      'invalid-argument',
      'failed-precondition',
      'insufficient-stock',
      'validation-failed'
    ];
    
    if (highSeverityErrors.includes(code)) {
      return ErrorSeverity.HIGH;
    } else if (mediumSeverityErrors.includes(code)) {
      return ErrorSeverity.MEDIUM;
    } else {
      return ErrorSeverity.LOW;
    }
  }

  /**
   * Get error category based on error code
   */
  private static getErrorCategory(code: string): ErrorCategory {
    if (code.startsWith('auth/')) {
      return ErrorCategory.AUTHENTICATION;
    } else if (['permission-denied', 'unauthenticated'].includes(code)) {
      return ErrorCategory.AUTHORIZATION;
    } else if (['invalid-argument', 'validation-failed'].includes(code)) {
      return ErrorCategory.VALIDATION;
    } else if (['insufficient-stock', 'invalid-sale-data'].includes(code)) {
      return ErrorCategory.BUSINESS_LOGIC;
    } else if (code.includes('ai-') || code.includes('voice-')) {
      return ErrorCategory.AI_SERVICE;
    } else if (['network-request-failed', 'deadline-exceeded'].includes(code)) {
      return ErrorCategory.NETWORK;
    } else {
      return ErrorCategory.SYSTEM;
    }
  }

  /**
   * Get HTTP status code based on error code
   */
  private static getStatusCode(code: string): number {
    const statusCodeMap: Record<string, number> = {
      'invalid-argument': 400,
      'validation-failed': 400,
      'unauthenticated': 401,
      'permission-denied': 403,
      'not-found': 404,
      'already-exists': 409,
      'failed-precondition': 412,
      'resource-exhausted': 429,
      'deadline-exceeded': 408,
      'unavailable': 503
    };
    
    return statusCodeMap[code] || 500;
  }

  /**
   * Create a success response
   */
  static createSuccessResponse<T>(data: T): SuccessResponse<T> {
    return {
      success: true,
      data
    };
  }

  /**
   * Create an error response
   */
  static createErrorResponse(error: AppError): AppErrorResponse {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details
      }
    };
  }

  /**
   * Wrap async functions with error handling
   */
  static wrapAsync<T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    context?: Partial<ErrorContext>
  ): (...args: T) => Promise<R> {
    return async (...args: T): Promise<R> => {
      try {
        return await fn(...args);
      } catch (error: any) {
        if (error instanceof AppError) {
          throw error;
        } else if (error.code) {
          throw ErrorHandler.handleFirebaseError(error, context);
        } else {
          throw ErrorHandler.handleSystemError(error, context);
        }
      }
    };
  }
}

/**
 * Utility function to check if an error is a specific type
 */
export function isErrorOfType(error: any, code: string): boolean {
  return error instanceof AppError && error.code === code;
}

/**
 * Utility function to extract user-friendly message from any error
 */
export function getUserFriendlyMessage(error: any): string {
  if (error instanceof AppError) {
    return error.message;
  } else if (error.code && FIREBASE_ERROR_MESSAGES[error.code]) {
    return FIREBASE_ERROR_MESSAGES[error.code];
  } else {
    return error.message || 'An unexpected error occurred';
  }
}