/**
 * Enhanced Error Handling System
 * Provides comprehensive error handling with retry logic and classification
 */

/**
 * API Error interface for standardized error handling
 */
export interface APIError {
  code: string;
  message: string;
  details?: any;
  retryable: boolean;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'api' | 'config' | 'network' | 'validation' | 'auth' | 'business';
}

/**
 * Error state for component error handling
 */
export interface ErrorState {
  hasError: boolean;
  error?: APIError;
  retryCount: number;
  lastRetryAt?: Date;
  canRetry: boolean;
}

/**
 * System error interface for comprehensive error tracking
 */
export interface SystemError {
  id: string;
  timestamp: Date;
  type: 'api' | 'config' | 'network' | 'validation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details: any;
  resolved: boolean;
  retryable: boolean;
  userId?: string;
  operation?: string;
  stackTrace?: string;
}

/**
 * Retry configuration interface
 */
export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryableErrors?: string[];
}

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffFactor: 2,
  retryableErrors: [
    'network-error',
    'timeout',
    'service-unavailable',
    'rate-limited',
    'temporary-failure'
  ]
};

/**
 * Enhanced API Error Handler with retry logic and classification
 */
export class APIErrorHandler {
  /**
   * Handle and classify any error into an APIError
   */
  static handle(error: any, context?: { operation?: string; userId?: string }): APIError {
    const timestamp = new Date();
    
    // If it's already an APIError, return it
    if (APIErrorHandler.isAPIError(error)) {
      return error;
    }

    // Handle Firebase errors
    if (error.code && typeof error.code === 'string') {
      return APIErrorHandler.handleFirebaseError(error, timestamp, context);
    }

    // Handle network errors
    if (APIErrorHandler.isNetworkError(error)) {
      return APIErrorHandler.handleNetworkError(error, timestamp, context);
    }

    // Handle validation errors
    if (APIErrorHandler.isValidationError(error)) {
      return APIErrorHandler.handleValidationError(error, timestamp, context);
    }

    // Handle generic errors
    return APIErrorHandler.handleGenericError(error, timestamp, context);
  }

  /**
   * Check if an error is retryable
   */
  static isRetryable(error: APIError): boolean {
    return error.retryable;
  }

  /**
   * Get retry delay based on attempt number using exponential backoff
   */
  static getRetryDelay(attempt: number, config: RetryConfig = DEFAULT_RETRY_CONFIG): number {
    const delay = config.baseDelay * Math.pow(config.backoffFactor, attempt - 1);
    return Math.min(delay, config.maxDelay);
  }

  /**
   * Create an initial error state
   */
  static createInitialErrorState(): ErrorState {
    return {
      hasError: false,
      retryCount: 0,
      canRetry: false
    };
  }

  /**
   * Update error state with new error
   */
  static updateErrorState(
    currentState: ErrorState, 
    error: APIError, 
    maxRetries: number = 3
  ): ErrorState {
    return {
      hasError: true,
      error,
      retryCount: currentState.retryCount,
      lastRetryAt: new Date(),
      canRetry: error.retryable && currentState.retryCount < maxRetries
    };
  }

  /**
   * Reset error state
   */
  static resetErrorState(): ErrorState {
    return APIErrorHandler.createInitialErrorState();
  }

  /**
   * Increment retry count in error state
   */
  static incrementRetryCount(state: ErrorState, maxRetries: number = 3): ErrorState {
    const newRetryCount = state.retryCount + 1;
    return {
      ...state,
      retryCount: newRetryCount,
      canRetry: state.error?.retryable && newRetryCount < maxRetries,
      lastRetryAt: new Date()
    };
  }

  // Private helper methods

  private static isAPIError(error: any): error is APIError {
    return error && 
           typeof error.code === 'string' && 
           typeof error.message === 'string' && 
           typeof error.retryable === 'boolean' &&
           error.timestamp instanceof Date;
  }

  private static handleFirebaseError(
    error: any, 
    timestamp: Date, 
    context?: { operation?: string; userId?: string }
  ): APIError {
    const code = error.code;
    const message = APIErrorHandler.getFirebaseErrorMessage(code);
    const retryable = APIErrorHandler.isFirebaseErrorRetryable(code);
    const severity = APIErrorHandler.getFirebaseErrorSeverity(code);
    const category = APIErrorHandler.getFirebaseErrorCategory(code);

    return {
      code,
      message,
      details: {
        originalMessage: error.message,
        context,
        firebaseError: true
      },
      retryable,
      timestamp,
      severity,
      category
    };
  }

  private static handleNetworkError(
    error: any, 
    timestamp: Date, 
    context?: { operation?: string; userId?: string }
  ): APIError {
    return {
      code: 'network-error',
      message: 'Network connection failed. Please check your internet connection.',
      details: {
        originalMessage: error.message,
        context,
        networkError: true
      },
      retryable: true,
      timestamp,
      severity: 'medium',
      category: 'network'
    };
  }

  private static handleValidationError(
    error: any, 
    timestamp: Date, 
    context?: { operation?: string; userId?: string }
  ): APIError {
    return {
      code: 'validation-error',
      message: error.message || 'Invalid data provided',
      details: {
        validationErrors: error.errors || [],
        context,
        validationError: true
      },
      retryable: false,
      timestamp,
      severity: 'medium',
      category: 'validation'
    };
  }

  private static handleGenericError(
    error: any, 
    timestamp: Date, 
    context?: { operation?: string; userId?: string }
  ): APIError {
    return {
      code: 'unknown-error',
      message: error.message || 'An unexpected error occurred',
      details: {
        originalError: error,
        context,
        stackTrace: error.stack
      },
      retryable: false,
      timestamp,
      severity: 'high',
      category: 'api'
    };
  }

  private static isNetworkError(error: any): boolean {
    return error.name === 'NetworkError' || 
           error.code === 'NETWORK_ERROR' ||
           error.message?.includes('network') ||
           error.message?.includes('fetch');
  }

  private static isValidationError(error: any): boolean {
    return error.name === 'ValidationError' || 
           error.code === 'VALIDATION_ERROR' ||
           (error.errors && Array.isArray(error.errors));
  }

  private static getFirebaseErrorMessage(code: string): string {
    const messages: Record<string, string> = {
      'auth/user-not-found': 'Invalid email or password',
      'auth/wrong-password': 'Invalid email or password',
      'auth/invalid-email': 'Please enter a valid email address',
      'auth/user-disabled': 'This account has been disabled',
      'auth/too-many-requests': 'Too many failed attempts. Please try again later',
      'auth/email-already-in-use': 'An account with this email already exists',
      'auth/weak-password': 'Password should be at least 6 characters',
      'auth/network-request-failed': 'Network error. Please check your connection',
      'permission-denied': 'You do not have permission to perform this action',
      'not-found': 'The requested data was not found',
      'already-exists': 'This item already exists',
      'invalid-argument': 'Invalid data provided',
      'unauthenticated': 'Please log in to continue',
      'failed-precondition': 'Operation failed due to current system state',
      'resource-exhausted': 'Service temporarily unavailable. Please try again',
      'deadline-exceeded': 'Request timed out. Please try again',
      'unavailable': 'Service temporarily unavailable'
    };
    
    return messages[code] || 'An unexpected error occurred';
  }

  private static isFirebaseErrorRetryable(code: string): boolean {
    const retryableErrors = [
      'auth/network-request-failed',
      'resource-exhausted',
      'deadline-exceeded',
      'unavailable'
    ];
    
    return retryableErrors.includes(code);
  }

  private static getFirebaseErrorSeverity(code: string): 'low' | 'medium' | 'high' | 'critical' {
    const highSeverityErrors = [
      'permission-denied',
      'unauthenticated',
      'auth/user-disabled'
    ];
    
    const mediumSeverityErrors = [
      'invalid-argument',
      'failed-precondition',
      'auth/invalid-email',
      'auth/weak-password'
    ];
    
    if (highSeverityErrors.includes(code)) {
      return 'high';
    } else if (mediumSeverityErrors.includes(code)) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  private static getFirebaseErrorCategory(code: string): 'api' | 'config' | 'network' | 'validation' | 'auth' | 'business' {
    if (code.startsWith('auth/')) {
      return 'auth';
    } else if (['permission-denied', 'unauthenticated'].includes(code)) {
      return 'auth';
    } else if (['invalid-argument'].includes(code)) {
      return 'validation';
    } else if (['auth/network-request-failed', 'deadline-exceeded'].includes(code)) {
      return 'network';
    } else {
      return 'api';
    }
  }
}