import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  className?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-3',
  xl: 'h-16 w-16 border-4',
};

/**
 * Reusable loading spinner component
 * Used to indicate loading states across the application
 */
export function LoadingSpinner({
  size = 'md',
  color = 'border-navy-600',
  className = '',
}: Readonly<LoadingSpinnerProps>) {
  return (
    <output aria-label="Loading">
      <span
        className={`inline-block animate-spin rounded-full ${color} border-t-transparent ${sizeClasses[size]} ${className}`}
        aria-hidden="true"
      />
      <span className="sr-only">Loading...</span>
    </output>
  );
}

interface LoadingOverlayProps {
  message?: string;
  transparent?: boolean;
}

/**
 * Full-screen loading overlay
 * Used for blocking operations that require user to wait
 */
export function LoadingOverlay({
  message = 'Loading...',
  transparent = false,
}: Readonly<LoadingOverlayProps>) {
  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity ${
        transparent ? 'bg-stone-900/30' : 'bg-stone-900/60'
      }`}
    >
      <div className="bg-white rounded-lg shadow-xl p-8 flex flex-col items-center space-y-4">
        <LoadingSpinner size="lg" />
        {message && (
          <p className="text-stone-700 font-medium text-center">{message}</p>
        )}
      </div>
    </div>
  );
}

interface LoadingStateProps {
  loading: boolean;
  error?: string | null;
  children: React.ReactNode;
  loadingMessage?: string;
  emptyMessage?: string;
  isEmpty?: boolean;
}

/**
 * Wrapper component to handle loading, error, and empty states
 * Simplifies conditional rendering in components
 */
export function LoadingState({
  loading,
  error,
  children,
  loadingMessage = 'Loading...',
  emptyMessage = 'No data available',
  isEmpty = false,
}: Readonly<LoadingStateProps>) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-stone-600">{loadingMessage}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <div className="flex items-start">
            <svg
              className="h-6 w-6 text-red-500 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <svg
          className="h-12 w-12 text-stone-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
        <p className="mt-4 text-stone-600">{emptyMessage}</p>
      </div>
    );
  }

  return <>{children}</>;
}

export default LoadingSpinner;
