import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="bg-card-bg/80 backdrop-blur-sm rounded-2xl p-8 border border-border/50 shadow-lg max-w-md w-full mx-4">
            <div className="text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-text-primary mb-4">Something went wrong</h2>
              <p className="text-text-secondary mb-6">
                We encountered an unexpected error. Please refresh the page or try again later.
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => window.location.reload()}
                  className="w-full px-4 py-2 bg-primary text-text-on-primary rounded-lg hover:bg-primary/80 transition"
                >
                  Refresh Page
                </button>
                <button
                  onClick={() => this.setState({ hasError: false, error: undefined })}
                  className="w-full px-4 py-2 bg-white/10 text-text-primary rounded-lg hover:bg-white/20 transition"
                >
                  Try Again
                </button>
              </div>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4 text-left">
                  <summary className="cursor-pointer text-sm text-text-secondary hover:text-text-primary">
                    Error Details (Development)
                  </summary>
                  <pre className="mt-2 text-xs bg-black/20 p-2 rounded overflow-auto max-h-32">
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;