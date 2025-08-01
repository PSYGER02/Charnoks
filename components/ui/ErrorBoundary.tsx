/**
 * Enhanced Error Boundary Component
 * Provides comprehensive error handling with retry functionality
 */

import React, { Component, ReactNode } from 'react';
import { APIErrorHandler, APIError } from '../../utils/enhancedErrorHandler';
import { ErrorInfo, ErrorBoundaryState } from '../../utils/errorTypes';

interface Props {
  children: ReactNode;
  fallback?: (error: APIError, retry: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  maxRetries?: number;
}

export class ErrorBoundary extends Component<Props, ErrorBoundaryState> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      retryCount: 0,
      canRetry: true
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const apiError = APIErrorHandler.handle(error, {
      operation: 'ErrorBoundary',
      userId: 'unknown'
    });

    this.setState({
      error,
      errorInfo,
      canRetry: apiError.retryable && this.state.retryCount < (this.props.maxRetries || 3)
    });

    // Call onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log error for monitoring
    console.error('ErrorBoundary caught an error:', {
      error: apiError,
      errorInfo,
      retryCount: this.state.retryCount
    });
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  handleRetry = () => {
    const maxRetries = this.props.maxRetries || 3;
    
    if (this.state.retryCount >= maxRetries) {
      return;
    }

    this.setState(prevState => ({
      retryCount: prevState.retryCount + 1,
      canRetry: prevState.retryCount + 1 < maxRetries
    }));

    // Add a small delay before retry
    this.retryTimeoutId = setTimeout(() => {
      this.setState({
        hasError: false,
        error: undefined,
        errorInfo: undefined,
        errorId: undefined
      });
    }, 1000);
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      errorId: undefined,
      retryCount: 0,
      canRetry: true
    });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const apiError = APIErrorHandler.handle(this.state.error);

      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(apiError, this.handleRetry);
      }

      // Default error UI
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center mr-3">
                <span className="text-red-400 text-xl">⚠️</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-red-300">Something went wrong</h3>
                <p className="text-red-400/80 text-sm">Error ID: {this.state.errorId}</p>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-red-200 mb-2">{apiError.message}</p>
              
              {apiError.severity === 'critical' && (
                <div className="bg-red-800/30 border border-red-600/50 rounded p-3 mb-3">
                  <p className="text-red-200 text-sm font-medium">Critical Error</p>
                  <p className="text-red-300/80 text-xs mt-1">
                    This error requires immediate attention. Please contact support if it persists.
                  </p>
                </div>
              )}

              {this.state.retryCount > 0 && (
                <p className="text-red-300/70 text-sm">
                  Retry attempt: {this.state.retryCount}/{this.props.maxRetries || 3}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              {this.state.canRetry && apiError.retryable && (
                <button
                  onClick={this.handleRetry}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                >
                  Try Again
                </button>
              )}
              
              <button
                onClick={this.handleReset}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
              >
                Reset
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <details className="mt-4">
                <summary className="text-red-300/70 text-xs cursor-pointer hover:text-red-300">
                  Technical Details (Development)
                </summary>
                <div className="mt-2 p-3 bg-black/30 rounded text-xs text-red-200/60 font-mono overflow-auto max-h-32">
                  <div className="mb-2">
                    <strong>Error:</strong> {this.state.error.message}
                  </div>
                  <div className="mb-2">
                    <strong>Component Stack:</strong>
                    <pre className="whitespace-pre-wrap text-xs">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </div>
                  {this.state.error.stack && (
                    <div>
                      <strong>Stack Trace:</strong>
                      <pre className="whitespace-pre-wrap text-xs">
                        {this.state.error.stack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;