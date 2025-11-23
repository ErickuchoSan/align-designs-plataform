import { useState, useCallback } from 'react';
import { getErrorMessage } from '@/lib/errors';

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export interface UseAsyncStateReturn<T> extends AsyncState<T> {
  setData: (data: T | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
  execute: <Args extends any[]>(
    asyncFunction: (...args: Args) => Promise<T>
  ) => (...args: Args) => Promise<T | null>;
}

/**
 * Hook to manage async operations with loading, error, and data states
 * Provides consistent state management for API calls and async operations
 *
 * @example
 * const { data, loading, error, execute } = useAsyncState<User>();
 * const fetchUser = execute(api.get);
 * await fetchUser('/users/1');
 */
export function useAsyncState<T = any>(
  initialData: T | null = null
): UseAsyncStateReturn<T> {
  const [state, setState] = useState<AsyncState<T>>({
    data: initialData,
    loading: false,
    error: null,
  });

  const setData = useCallback((data: T | null) => {
    setState((prev) => ({ ...prev, data, loading: false, error: null }));
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setState((prev) => ({ ...prev, loading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, error, loading: false }));
  }, []);

  const reset = useCallback(() => {
    setState({
      data: initialData,
      loading: false,
      error: null,
    });
  }, [initialData]);

  const execute = useCallback(
    <Args extends any[]>(asyncFunction: (...args: Args) => Promise<T>) =>
      async (...args: Args): Promise<T | null> => {
        setState((prev) => ({ ...prev, loading: true, error: null }));
        try {
          const result = await asyncFunction(...args);
          setState({
            data: result,
            loading: false,
            error: null,
          });
          return result;
        } catch (err) {
          const errorMessage = getErrorMessage(err, 'An error occurred');
          setState((prev) => ({
            ...prev,
            loading: false,
            error: errorMessage,
          }));
          return null;
        }
      },
    []
  );

  return {
    ...state,
    setData,
    setLoading,
    setError,
    reset,
    execute,
  };
}

export default useAsyncState;
