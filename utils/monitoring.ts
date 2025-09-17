/**
 * Performance Monitoring System
 * Provides comprehensive monitoring and logging capabilities
 */

/**
 * Performance metric interface
 */
export interface PerformanceMetric {
  operation: string;
  duration: number;
  timestamp: number;
  success: boolean;
  error?: string;
  metadata?: Record<string, any>;
}

/**
 * System health interface
 */
export interface SystemHealth {
  uptime: number;
  memoryUsage: number;
  activeConnections: number;
  errorRate: number;
  averageResponseTime: number;
  lastUpdated: number;
}

/**
 * Timer interface for tracking operation duration
 */
interface Timer {
  id: string;
  operation: string;
  startTime: number;
  metadata?: Record<string, any>;
}

/**
 * Performance Monitor class
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private timers = new Map<string, Timer>();
  private metrics: PerformanceMetric[] = [];
  private maxMetrics = 1000; // Keep last 1000 metrics
  private errorCount = 0;
  private totalOperations = 0;
  private startTime = Date.now();

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Start timing an operation
   */
  startTimer(operation: string, metadata?: Record<string, any>): string {
    const id = `${operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.timers.set(id, {
      id,
      operation,
      startTime: performance.now(),
      metadata
    });

    return id;
  }

  /**
   * End timing and record metric
   */
  endTimer(timerId: string, success = true, error?: string): number {
    const timer = this.timers.get(timerId);
    if (!timer) {
      console.warn(`Timer ${timerId} not found`);
      return 0;
    }

    const duration = performance.now() - timer.startTime;
    
    this.recordMetric({
      operation: timer.operation,
      duration,
      timestamp: Date.now(),
      success,
      error,
      metadata: timer.metadata
    });

    this.timers.delete(timerId);
    return duration;
  }

  /**
   * Record a performance metric
   */
  recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    this.totalOperations++;
    
    if (!metric.success) {
      this.errorCount++;
    }

    // Keep only the last N metrics to prevent memory issues
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Log metric in development
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.log(`[PERF] ${metric.operation}: ${metric.duration.toFixed(2)}ms`, {
        success: metric.success,
        error: metric.error,
        metadata: metric.metadata
      });
    }
  }

  /**
   * Log a custom metric
   */
  logMetric(name: string, value: number, tags?: Record<string, string>): void {
    this.recordMetric({
      operation: name,
      duration: value,
      timestamp: Date.now(),
      success: true,
      metadata: tags
    });
  }

  /**
   * Log an error with context
   */
  logError(error: Error, context?: Record<string, any>): void {
    const sanitizedMessage = this.sanitizeLogInput(error.message);
    const errorData = {
      message: sanitizedMessage,
      stack: error.stack,
      name: error.name,
      timestamp: Date.now(),
      context: this.sanitizeContext(context)
    };

    this.errorCount++;

    // Log to console in development with sanitization
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.error('[ERROR] Error occurred:', sanitizedMessage);
    }

    // In production, send to external logging service
    if (process.env.NODE_ENV === 'production') {
      this.sendToLoggingService('error', errorData);
    }
  }

  /**
   * Get system health metrics
   */
  getSystemHealth(): SystemHealth {
    const now = Date.now();
    const uptime = now - this.startTime;
    const recentMetrics = this.metrics.filter(m => now - m.timestamp < 300000); // Last 5 minutes
    
    const averageResponseTime = recentMetrics.length > 0 
      ? recentMetrics.reduce((sum, m) => sum + m.duration, 0) / recentMetrics.length
      : 0;

    const errorRate = this.totalOperations > 0 
      ? (this.errorCount / this.totalOperations) * 100
      : 0;

    return {
      uptime,
      memoryUsage: this.getMemoryUsage(),
      activeConnections: this.timers.size,
      errorRate,
      averageResponseTime,
      lastUpdated: now
    };
  }

  /**
   * Get memory usage (browser or Node.js)
   */
  private getMemoryUsage(): number {
    if (typeof window !== 'undefined') {
      // Browser environment
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize / 1024 / 1024; // MB
      }
      return 0;
    } else {
      // Node.js environment
      if (typeof process !== 'undefined' && process.memoryUsage) {
        return process.memoryUsage().heapUsed / 1024 / 1024; // MB
      }
      return 0;
    }
  }

  /**
   * Get performance metrics for a specific operation
   */
  getMetricsForOperation(operation: string, limit = 100): PerformanceMetric[] {
    return this.metrics
      .filter(m => m.operation === operation)
      .slice(-limit);
  }

  /**
   * Get recent metrics
   */
  getRecentMetrics(minutes = 5): PerformanceMetric[] {
    const cutoff = Date.now() - (minutes * 60 * 1000);
    return this.metrics.filter(m => m.timestamp > cutoff);
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): {
    totalOperations: number;
    errorCount: number;
    errorRate: number;
    averageResponseTime: number;
    slowestOperations: Array<{ operation: string; avgDuration: number }>;
  } {
    const operationStats = new Map<string, { total: number; sum: number; count: number }>();
    
    this.metrics.forEach(metric => {
      const stats = operationStats.get(metric.operation) || { total: 0, sum: 0, count: 0 };
      stats.total += metric.duration;
      stats.sum += metric.duration;
      stats.count++;
      operationStats.set(metric.operation, stats);
    });

    const slowestOperations = Array.from(operationStats.entries())
      .map(([operation, stats]) => ({
        operation,
        avgDuration: stats.sum / stats.count
      }))
      .sort((a, b) => b.avgDuration - a.avgDuration)
      .slice(0, 10);

    const averageResponseTime = this.metrics.length > 0
      ? this.metrics.reduce((sum, m) => sum + m.duration, 0) / this.metrics.length
      : 0;

    return {
      totalOperations: this.totalOperations,
      errorCount: this.errorCount,
      errorRate: this.totalOperations > 0 ? (this.errorCount / this.totalOperations) * 100 : 0,
      averageResponseTime,
      slowestOperations
    };
  }

  /**
   * Clear all metrics (useful for testing)
   */
  clearMetrics(): void {
    this.metrics = [];
    this.timers.clear();
    this.errorCount = 0;
    this.totalOperations = 0;
    this.startTime = Date.now();
  }

  /**
   * Sanitize log input to prevent injection
   */
  private sanitizeLogInput(input: any): string {
    if (input === null || input === undefined) return 'null';
    return String(input)
      .replace(/[\r\n\t]/g, ' ')
      .replace(/[<>&"']/g, '')
      .substring(0, 500);
  }

  /**
   * Sanitize context object
   */
  private sanitizeContext(context?: Record<string, any>): Record<string, any> {
    if (!context) return {};
    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(context)) {
      sanitized[key] = this.sanitizeLogInput(value);
    }
    return sanitized;
  }

  /**
   * Validate and sanitize file paths
   */
  private validateFilePath(filePath: string): string {
    // Remove path traversal attempts and dangerous characters
    const sanitized = filePath.replace(/\.\./g, '').replace(/[^a-zA-Z0-9._-]/g, '');
    // Ensure path stays within allowed directories - no slashes allowed
    if (sanitized.includes('/') || sanitized.includes('\\')) {
      throw new Error('Invalid file path - directory traversal not allowed');
    }
    return sanitized;
  }

  /**
   * Send data to external logging service
   */
  private sendToLoggingService(type: 'metric' | 'error', data: any): void {
    // This would integrate with services like:
    // - Google Cloud Logging
    // - Sentry
    // - LogRocket
    // - DataDog
    // - New Relic
    
    // Example implementation for Google Cloud Logging
    if (typeof fetch !== 'undefined') {
      fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, data: this.sanitizeContext(data) })
      }).catch(err => console.warn('Failed to send log:', this.sanitizeLogInput(err)));
    }
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();

/**
 * Decorator function to automatically monitor function performance
 */
export function monitorFunction<T extends any[], R>(
  name: string,
  fn: (...args: T) => Promise<R>
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    const timerId = performanceMonitor.startTimer(name, {
      args: args.length,
      timestamp: Date.now()
    });

    try {
      const result = await fn(...args);
      performanceMonitor.endTimer(timerId, true);
      return result;
    } catch (error: any) {
      performanceMonitor.endTimer(timerId, false, error.message);
      performanceMonitor.logError(error, { operation: name, argsCount: args.length });
      throw error;
    }
  };
}

/**
 * Decorator for synchronous functions
 */
export function monitorSyncFunction<T extends any[], R>(
  name: string,
  fn: (...args: T) => R
): (...args: T) => R {
  return (...args: T): R => {
    const timerId = performanceMonitor.startTimer(name, {
      args: args.length,
      timestamp: Date.now()
    });

    try {
      const result = fn(...args);
      performanceMonitor.endTimer(timerId, true);
      return result;
    } catch (error: any) {
      performanceMonitor.endTimer(timerId, false, error.message);
      performanceMonitor.logError(error, { operation: name, argsCount: args.length });
      throw error;
    }
  };
}

/**
 * React hook for monitoring component performance
 */
export function usePerformanceMonitor(componentName: string) {
  const [renderCount, setRenderCount] = React.useState(0);
  const renderStartTime = React.useRef<number>(0);

  React.useEffect(() => {
    renderStartTime.current = performance.now();
    setRenderCount(prev => prev + 1);
  });

  React.useEffect(() => {
    const renderTime = performance.now() - renderStartTime.current;
    performanceMonitor.logMetric(`${componentName}_render`, renderTime, {
      renderCount: renderCount.toString()
    });
  });

  const trackEvent = React.useCallback((eventName: string, metadata?: Record<string, any>) => {
    performanceMonitor.logMetric(`${componentName}_${eventName}`, 1, metadata);
  }, [componentName]);

  const trackError = React.useCallback((error: Error, context?: Record<string, any>) => {
    performanceMonitor.logError(error, {
      component: componentName,
      renderCount,
      ...context
    });
  }, [componentName, renderCount]);

  return {
    trackEvent,
    trackError,
    renderCount
  };
}

/**
 * Performance monitoring utilities
 */
export const MonitoringUtils = {
  /**
   * Monitor API calls
   */
  monitorApiCall: async <T>(
    endpoint: string,
    apiCall: () => Promise<T>
  ): Promise<T> => {
    const timerId = performanceMonitor.startTimer(`api_${endpoint}`, {
      endpoint,
      timestamp: Date.now()
    });

    try {
      const result = await apiCall();
      performanceMonitor.endTimer(timerId, true);
      return result;
    } catch (error: any) {
      performanceMonitor.endTimer(timerId, false, error.message);
      throw error;
    }
  },

  /**
   * Monitor database operations
   */
  monitorDbOperation: async <T>(
    operation: string,
    dbCall: () => Promise<T>
  ): Promise<T> => {
    const timerId = performanceMonitor.startTimer(`db_${operation}`, {
      operation,
      timestamp: Date.now()
    });

    try {
      const result = await dbCall();
      performanceMonitor.endTimer(timerId, true);
      return result;
    } catch (error: any) {
      performanceMonitor.endTimer(timerId, false, error.message);
      throw error;
    }
  },

  /**
   * Monitor user interactions
   */
  trackUserInteraction: (action: string, metadata?: Record<string, any>) => {
    performanceMonitor.logMetric(`user_${action}`, 1, {
      timestamp: Date.now().toString(),
      ...metadata
    });
  },

  /**
   * Monitor page load performance
   */
  trackPageLoad: (pageName: string) => {
    if (typeof window !== 'undefined' && window.performance) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        performanceMonitor.logMetric(`page_load_${pageName}`, navigation.loadEventEnd - navigation.fetchStart);
        performanceMonitor.logMetric(`page_dom_ready_${pageName}`, navigation.domContentLoadedEventEnd - navigation.fetchStart);
      }
    }
  },

  /**
   * Get performance report
   */
  getPerformanceReport: () => {
    return {
      systemHealth: performanceMonitor.getSystemHealth(),
      performanceSummary: performanceMonitor.getPerformanceSummary(),
      recentMetrics: performanceMonitor.getRecentMetrics(10)
    };
  }
};

// Import React for hooks
import React from 'react';

// Auto-track page visibility changes
if (typeof window !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    MonitoringUtils.trackUserInteraction('page_visibility_change', {
      hidden: document.hidden.toString()
    });
  });

  // Track unhandled errors
  window.addEventListener('error', (event) => {
    performanceMonitor.logError(event.error || new Error(event.message), {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    });
  });

  // Track unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    performanceMonitor.logError(
      new Error(`Unhandled Promise Rejection: ${event.reason}`),
      { type: 'unhandled_promise_rejection' }
    );
  });
}