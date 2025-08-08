/**
 * Comprehensive Error Types and Interfaces
 * Centralized type definitions for the enhanced error handling system
 */

// Import and re-export all types from enhanced error handler
import type {
  APIError as _APIError,
  ErrorState as _ErrorState,
  SystemError as _SystemError,
  RetryConfig as _RetryConfig
} from './enhancedErrorHandler';

import type {
  RetryResult as _RetryResult,
  RetryAttempt as _RetryAttempt
} from './retryManager';

export type APIError = _APIError;
export type ErrorState = _ErrorState;
export type SystemError = _SystemError;
export type RetryConfig = _RetryConfig;
export type RetryResult<T> = _RetryResult<T>;
export type RetryAttempt = _RetryAttempt;

/**
 * Error severity levels
 */
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Error categories for classification
 */
export type ErrorCategory = 'api' | 'config' | 'network' | 'validation' | 'auth' | 'business';

/**
 * Error context for logging and debugging
 */
export interface ErrorContext {
  userId?: string;
  operation?: string;
  timestamp?: Date;
  userAgent?: string;
  ip?: string;
  additionalData?: any;
}

/**
 * Error information for React Error Boundaries
 */
export interface ErrorInfo {
  componentStack: string;
  errorBoundary?: string;
  eventType?: string;
}

/**
 * Loading state with error handling
 */
export interface LoadingState<T> {
  data: T | null;
  loading: boolean;
  error: APIError | null;
  lastUpdated: Date | null;
  retryCount: number;
}

/**
 * API Response types
 */
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: APIError;
  metadata?: {
    timestamp: Date;
    requestId?: string;
    version?: string;
  };
}

/**
 * Error logging interface
 */
export interface ErrorLog {
  id: string;
  timestamp: Date;
  level: 'error' | 'warn' | 'info' | 'debug';
  message: string;
  error?: APIError;
  context?: ErrorContext;
  stackTrace?: string;
  resolved: boolean;
}

/**
 * Error recovery action
 */
export interface ErrorRecoveryAction {
  label: string;
  action: () => void | Promise<void>;
  primary?: boolean;
}

/**
 * Error display props for UI components
 */
export interface ErrorDisplayProps {
  error: APIError;
  onRetry?: () => void;
  onDismiss?: () => void;
  showDetails?: boolean;
  recoveryActions?: ErrorRecoveryAction[];
}

/**
 * Configuration error props
 */
export interface ConfigurationErrorProps {
  missingConfig: string[];
  invalidConfig: string[];
  onConfigure: () => void;
  onRefresh?: () => void;
}

/**
 * System health status
 */
export interface SystemHealthStatus {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  services: {
    supabase: 'connected' | 'disconnected' | 'error';
    gemini: 'available' | 'unavailable' | 'error';
    auth: 'working' | 'failing' | 'error';
  };
  errors: SystemError[];
  lastChecked: Date;
}

/**
 * Error boundary state
 */
export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId?: string;
  retryCount: number;
  canRetry: boolean;
}

/**
 * Validation error details
 */
export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: any;
}

/**
 * Network error details
 */
export interface NetworkError {
  url?: string;
  method?: string;
  status?: number;
  statusText?: string;
  timeout?: boolean;
}

/**
 * Configuration validation result
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

/**
 * Error metrics for monitoring
 */
export interface ErrorMetrics {
  totalErrors: number;
  errorsByCategory: Record<ErrorCategory, number>;
  errorsBySeverity: Record<ErrorSeverity, number>;
  retrySuccessRate: number;
  averageRetryAttempts: number;
  circuitBreakerTrips: number;
  timeRange: {
    start: Date;
    end: Date;
  };
}

/**
 * Error handler configuration
 */
export interface ErrorHandlerConfig {
  enableLogging: boolean;
  enableRetries: boolean;
  enableCircuitBreaker: boolean;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
  retryConfig: RetryConfig;
  circuitBreakerConfig: {
    threshold: number;
    timeout: number;
    resetTimeout: number;
  };
}

/**
 * Type guards for error checking
 */
export const ErrorTypeGuards = {
  isAPIError: (error: any): error is APIError => {
    return error && 
           typeof error.code === 'string' && 
           typeof error.message === 'string' && 
           typeof error.retryable === 'boolean' &&
           error.timestamp instanceof Date;
  },

  isSystemError: (error: any): error is SystemError => {
    return error &&
           typeof error.id === 'string' &&
           error.timestamp instanceof Date &&
           typeof error.type === 'string' &&
           typeof error.severity === 'string';
  },

  isValidationError: (error: any): error is ValidationError => {
    return error &&
           typeof error.field === 'string' &&
           typeof error.message === 'string' &&
           typeof error.code === 'string';
  },

  isNetworkError: (error: any): error is NetworkError => {
    return error &&
           (error.name === 'NetworkError' ||
            error.code === 'NETWORK_ERROR' ||
            typeof error.status === 'number');
  }
};

/**
 * Error constants
 */
export const ERROR_CODES = {
  // Network errors
  NETWORK_ERROR: 'network-error',
  TIMEOUT: 'timeout',
  CONNECTION_FAILED: 'connection-failed',
  
  // Authentication errors
  UNAUTHORIZED: 'unauthorized',
  FORBIDDEN: 'forbidden',
  TOKEN_EXPIRED: 'token-expired',
  
  // Validation errors
  VALIDATION_FAILED: 'validation-failed',
  INVALID_INPUT: 'invalid-input',
  MISSING_REQUIRED: 'missing-required',
  
  // Business logic errors
  INSUFFICIENT_PERMISSIONS: 'insufficient-permissions',
  RESOURCE_NOT_FOUND: 'resource-not-found',
  RESOURCE_CONFLICT: 'resource-conflict',
  
  // System errors
  INTERNAL_ERROR: 'internal-error',
  SERVICE_UNAVAILABLE: 'service-unavailable',
  CONFIGURATION_ERROR: 'configuration-error',
  
  // AI service errors
  AI_SERVICE_ERROR: 'ai-service-error',
  AI_QUOTA_EXCEEDED: 'ai-quota-exceeded',
  AI_INVALID_REQUEST: 'ai-invalid-request'
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];