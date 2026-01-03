import { useState, useCallback, useRef } from 'react';
import { handleApiError } from '@/lib/errors';

export interface AsyncOperationOptions {
  /** Success message to display */
  successMessage?: string;
  /** Error message prefix (full message will be: prefix + actual error) */
  errorMessagePrefix?: string;
  /** Callback to execute on success */
  onSuccess?: (data?: any) => void | Promise<void>;
  /** Callback to execute on error */
  onError?: (error: Error) => void;
  /** Whether to automatically clear success message after delay */
  autoClearSuccess?: boolean;
  /** Delay in ms before clearing success message (default: 3000) */
  successClearDelay?: number;
}

export interface AsyncOperationState {
  loading: boolean;
  error: string;
  success: string;
}

export interface AsyncOperationActions {
  execute: <T = any>(operation: () => Promise<T>, options?: AsyncOperationOptions) => Promise<T | null>;
  setError: (error: string) => void;
  setSuccess: (success: string) => void;
  clearError: () => void;
  clearSuccess: () => void;
  reset: () => void;
}

export interface UseAsyncOperationReturn extends AsyncOperationState, AsyncOperationActions { }

/**
 * Reusable hook for handling async operations with loading/error/success states
 * Eliminates duplicated try-catch patterns across CRUD operations
 *
 * @returns State and actions for async operations
 *
 * @example
 * function MyComponent() {
 *   const { loading, error, success, execute } = useAsyncOperation();
 *
 *   const handleSave = async () => {
 *     await execute(
 *       () => api.post('/items', data),
 *       {
 *         successMessage: 'Item created successfully',
 *         errorMessagePrefix: 'Failed to create item',
 *         onSuccess: () => refetchItems(),
 *       }
 *     );
 *   };
 *
 *   return (
 *     <div>
 *       {loading && <Spinner />}
 *       {error && <Error message={error} />}
 *       {success && <Success message={success} />}
 *       <button onClick={handleSave}>Save</button>
 *     </div>
 *   );
 * }
 */
export function useAsyncOperation(): UseAsyncOperationReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Track timeout for auto-clearing success messages
  const successTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearError = useCallback(() => setError(''), []);
  const clearSuccess = useCallback(() => {
    setSuccess('');
    if (successTimeoutRef.current) {
      clearTimeout(successTimeoutRef.current);
      successTimeoutRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    setLoading(false);
    setError('');
    setSuccess('');
    if (successTimeoutRef.current) {
      clearTimeout(successTimeoutRef.current);
      successTimeoutRef.current = null;
    }
  }, []);

  const execute = useCallback(
    async <T = any>(
      operation: () => Promise<T>,
      options: AsyncOperationOptions = {}
    ): Promise<T | null> => {
      const {
        successMessage,
        errorMessagePrefix = 'Operation failed',
        onSuccess,
        onError,
        autoClearSuccess = true,
        successClearDelay = 3000,
      } = options;

      try {
        setLoading(true);
        setError('');
        setSuccess('');

        const result = await operation();

        // Set success message if provided
        if (successMessage) {
          setSuccess(successMessage);

          // Auto-clear success message after delay
          if (autoClearSuccess) {
            if (successTimeoutRef.current) {
              clearTimeout(successTimeoutRef.current);
            }
            successTimeoutRef.current = setTimeout(() => {
              setSuccess('');
              successTimeoutRef.current = null;
            }, successClearDelay);
          }
        }

        // Execute success callback
        if (onSuccess) {
          await onSuccess(result);
        }

        return result;
      } catch (err) {
        const errorMessage = handleApiError(err, errorMessagePrefix);
        setError(errorMessage);

        // Execute error callback
        if (onError) {
          onError(err as Error);
        }

        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    // State
    loading,
    error,
    success,
    // Actions
    execute,
    setError,
    setSuccess,
    clearError,
    clearSuccess,
    reset,
  };
}
