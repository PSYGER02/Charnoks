/**
 * Retry Manager with exponential backoff logic
 * Provides robust retry mechanisms for failed operations
 */

import { APIError, APIErrorHandler, RetryConfig } from './enhancedErrorHandler';

/**
 * Retry result interface
 */
export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: APIError;
  attempts: number;
  totalTime: number;
}

/**
 * Retry attempt information
 */
export interface RetryAttempt {
  attemptNumber: number;
  delay: number;
  error?: APIError;
  timestamp: Date;
}

/**
 * Retry Manager class with exponential backoff
 */
export class RetryManager {
  /**
   * Execute an operation with retry logic
   */
  static async withRetry<T>(
    operation: () => Promise<T>,
    config: Partial<RetryConfig> = {},
    context?: { operation?: string; userId?: string }
  ): Promise<T> {
    const finalConfig: RetryConfig = {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 30000,
      backoffFactor: 2,
      retryableErrors: [
        'network-error',
        'timeout',
        'service-unavailable',
        'rate-limited',
        'temporary-failure',
        'resource-exhausted',
        'deadline-exceeded',
        'unavailable'
      ],
      ...config
    };

    const attempts: RetryAttempt[] = [];
    const startTime = Date.now();

    for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
      const attemptStart = Date.now();
      
      try {
        const result = await operation();
        
        // Log successful retry if it wasn't the first attempt
        if (attempt > 1) {
          console.log(`Operation succeeded on attempt ${attempt}/${finalConfig.maxAttempts}`, {
            context,
            attempts: attempts.length,
            totalTime: Date.now() - startTime
          });
        }
        
        return result;
      } catch (error: any) {
        const apiError = APIErrorHandler.handle(error, context);
        
        const attemptInfo: RetryAttempt = {
          attemptNumber: attempt,
          delay: 0,
          error: apiError,
          timestamp: new Date()
        };
        
        attempts.push(attemptInfo);

        // If this is the last attempt or error is not retryable, throw the error
        if (attempt === finalConfig.maxAttempts || !RetryManager.shouldRetry(apiError, finalConfig)) {
          console.error(`Operation failed after ${attempt} attempts`, {
            context,
            error: apiError,
            attempts,
            totalTime: Date.now() - startTime
          });
          
          throw apiError;
        }

        // Calculate delay for next attempt
        const delay = RetryManager.calculateDelay(attempt, finalConfig);
        attemptInfo.delay = delay;

        console.warn(`Operation failed on attempt ${attempt}/${finalConfig.maxAttempts}, retrying in ${delay}ms`, {
          context,
          error: apiError.message,
          nextAttempt: attempt + 1
        });

        // Wait before next attempt
        await RetryManager.delay(delay);
      }
    }

    // This should never be reached, but TypeScript requires it
    throw new Error('Retry logic error: exceeded maximum attempts without throwing');
  }

  /**
   * Execute an operation with retry and return detailed result
   */
  static async withRetryDetailed<T>(
    operation: () => Promise<T>,
    config: Partial<RetryConfig> = {},
    context?: { operation?: string; userId?: string }
  ): Promise<RetryResult<T>> {
    const startTime = Date.now();
    const attempts: RetryAttempt[] = [];

    try {
      const result = await RetryManager.withRetry(operation, config, context);
      
      return {
        success: true,
        data: result,
        attempts: attempts.length || 1,
        totalTime: Date.now() - startTime
      };
    } catch (error: any) {
      const apiError = APIErrorHandler.handle(error, context);
      
      return {
        success: false,
        error: apiError,
        attempts: attempts.length || 1,
        totalTime: Date.now() - startTime
      };
    }
  }

  /**
   * Create a retryable version of a function
   */
  static createRetryableFunction<T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    config: Partial<RetryConfig> = {},
    context?: { operation?: string; userId?: string }
  ): (...args: T) => Promise<R> {
    return async (...args: T): Promise<R> => {
      return RetryManager.withRetry(() => fn(...args), config, context);
    };
  }

  /**
   * Batch retry operations with individual retry logic
   */
  static async batchWithRetry<T>(
    operations: Array<() => Promise<T>>,
    config: Partial<RetryConfig> = {},
    context?: { operation?: string; userId?: string }
  ): Promise<Array<RetryResult<T>>> {
    const promises = operations.map((operation, index) => 
      RetryManager.withRetryDetailed(
        operation, 
        config, 
        { ...context, operation: `${context?.operation || 'batch'}_${index}` }
      )
    );

    return Promise.all(promises);
  }

  /**
   * Retry with circuit breaker pattern
   */
  static async withCircuitBreaker<T>(
    operation: () => Promise<T>,
    config: Partial<RetryConfig> & {
      circuitBreakerThreshold?: number;
      circuitBreakerTimeout?: number;
    } = {},
    context?: { operation?: string; userId?: string }
  ): Promise<T> {
    const circuitBreakerKey = `circuit_breaker_${context?.operation || 'default'}`;
    const threshold = config.circuitBreakerThreshold || 5;
    const timeout = config.circuitBreakerTimeout || 60000; // 1 minute

    // Check if circuit breaker is open
    if (RetryManager.isCircuitBreakerOpen(circuitBreakerKey, threshold, timeout)) {
      throw APIErrorHandler.handle(
        new Error('Circuit breaker is open - service temporarily unavailable'),
        context
      );
    }

    try {
      const result = await RetryManager.withRetry(operation, config, context);
      
      // Reset circuit breaker on success
      RetryManager.resetCircuitBreaker(circuitBreakerKey);
      
      return result;
    } catch (error: any) {
      // Record failure for circuit breaker
      RetryManager.recordCircuitBreakerFailure(circuitBreakerKey);
      throw error;
    }
  }

  // Private helper methods

  private static shouldRetry(error: APIError, config: RetryConfig): boolean {
    if (!error.retryable) {
      return false;
    }

    if (config.retryableErrors && config.retryableErrors.length > 0) {
      return config.retryableErrors.includes(error.code);
    }

    return true;
  }

  private static calculateDelay(attempt: number, config: RetryConfig): number {
    const delay = config.baseDelay * Math.pow(config.backoffFactor, attempt - 1);
    const jitter = Math.random() * 0.1 * delay; // Add 10% jitter
    return Math.min(delay + jitter, config.maxDelay);
  }

  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Circuit breaker implementation (simple in-memory version)
  private static circuitBreakerState: Map<string, {
    failures: number;
    lastFailure: Date;
    isOpen: boolean;
  }> = new Map();

  private static isCircuitBreakerOpen(key: string, threshold: number, timeout: number): boolean {
    const state = RetryManager.circuitBreakerState.get(key);
    
    if (!state) {
      return false;
    }

    // Check if timeout has passed and circuit should be half-open
    if (state.isOpen && Date.now() - state.lastFailure.getTime() > timeout) {
      state.isOpen = false;
      state.failures = 0;
      return false;
    }

    return state.isOpen;
  }

  private static recordCircuitBreakerFailure(key: string): void {
    const state = RetryManager.circuitBreakerState.get(key) || {
      failures: 0,
      lastFailure: new Date(),
      isOpen: false
    };

    state.failures++;
    state.lastFailure = new Date();

    // Open circuit if threshold exceeded
    if (state.failures >= 5) { // Default threshold
      state.isOpen = true;
    }

    RetryManager.circuitBreakerState.set(key, state);
  }

  private static resetCircuitBreaker(key: string): void {
    RetryManager.circuitBreakerState.delete(key);
  }

  /**
   * Get circuit breaker status for monitoring
   */
  static getCircuitBreakerStatus(): Record<string, {
    failures: number;
    lastFailure: Date;
    isOpen: boolean;
  }> {
    const status: Record<string, any> = {};
    
    RetryManager.circuitBreakerState.forEach((value, key) => {
      status[key] = { ...value };
    });

    return status;
  }

  /**
   * Clear all circuit breaker states (useful for testing)
   */
  static clearCircuitBreakerStates(): void {
    RetryManager.circuitBreakerState.clear();
  }
}

/**
 * Utility function to create a retryable version of any async function
 */
export function makeRetryable<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  config?: Partial<RetryConfig>
): (...args: T) => Promise<R> {
  return RetryManager.createRetryableFunction(fn, config);
}

/**
 * Decorator for retryable methods (if using experimental decorators)
 */
export function retryable(config?: Partial<RetryConfig>) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      return RetryManager.withRetry(
        () => originalMethod.apply(this, args),
        config,
        { operation: `${target.constructor.name}.${propertyKey}` }
      );
    };

    return descriptor;
  };
}