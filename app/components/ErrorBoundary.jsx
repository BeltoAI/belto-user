"use client";

import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error details
    console.error('ErrorBoundary caught an error:', {
      error: error,
      errorInfo: errorInfo,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Log specific details about removeEventListener errors
    if (error.message && error.message.includes('removeEventListener')) {
      console.error('removeEventListener error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
    }
  }

  render() {
    if (this.state.hasError) {
      // Render fallback UI
      return (
        <div className="flex flex-col items-center justify-center h-full min-h-[400px] bg-[#111111] text-white p-8">
          <div className="max-w-md text-center">
            <div className="mb-4">
              <svg 
                className="w-16 h-16 text-red-500 mx-auto mb-4" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" 
                />
              </svg>
              <h2 className="text-xl font-semibold text-white mb-2">
                Something went wrong
              </h2>
              <p className="text-gray-400 mb-4">
                {this.props.componentName ? (
                  `There was an error loading the ${this.props.componentName} component.`
                ) : (
                  'There was an error loading this component.'
                )}
              </p>
              
              {this.state.error && this.state.error.message.includes('removeEventListener') && (
                <p className="text-sm text-yellow-400 mb-4">
                  This appears to be a temporary initialization issue. Please try refreshing the page.
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null, errorInfo: null });
                }}
                className="w-full bg-[#FFB800] text-black px-4 py-2 rounded-lg hover:bg-[#E6A600] transition-colors"
              >
                Try Again
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-[#262626] text-white px-4 py-2 rounded-lg hover:bg-[#363636] transition-colors"
              >
                Refresh Page
              </button>
            </div>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-gray-400 hover:text-white">
                  Error Details (Development Only)
                </summary>
                <div className="mt-2 p-3 bg-[#262626] rounded text-xs font-mono text-red-400 overflow-auto max-h-32">
                  <div className="mb-2">
                    <strong>Error:</strong> {this.state.error.message}
                  </div>
                  {this.state.error.stack && (
                    <div>
                      <strong>Stack:</strong>
                      <pre className="whitespace-pre-wrap">{this.state.error.stack}</pre>
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
