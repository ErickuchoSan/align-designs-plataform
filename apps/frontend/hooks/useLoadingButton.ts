import { useState, useCallback } from 'react';

/**
 * Hook to manage button loading state with async operations
 * Provides consistent loading state management across the application
 *
 * @example
 * const { isLoading, executeAsync } = useLoadingButton();
 *
 * const handleSubmit = executeAsync(async () => {
 *   await api.post('/endpoint', data);
 * });
 */
export function useLoadingButton(initialLoading = false) {
  const [isLoading, setIsLoading] = useState(initialLoading);

  /**
   * Executes an async function and manages loading state automatically
   * Catches errors and re-throws them after setting loading to false
   */
  const executeAsync = useCallback(
    <T>(asyncFn: () => Promise<T>) => {
      return async (): Promise<T | undefined> => {
        setIsLoading(true);
        try {
          const result = await asyncFn();
          return result;
        } catch (error) {
          throw error;
        } finally {
          setIsLoading(false);
        }
      };
    },
    [],
  );

  /**
   * Manually set loading state (for edge cases)
   */
  const setLoading = useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, []);

  return {
    isLoading,
    setLoading,
    executeAsync,
  };
}

/**
 * Hook to manage multiple independent loading states
 * Useful for forms with multiple submit buttons or actions
 *
 * @example
 * const { loadingStates, setLoading, executeAsync } = useMultipleLoadingStates();
 *
 * const handleCreate = executeAsync('create', async () => {
 *   await api.post('/create', data);
 * });
 *
 * <LoadingButton isLoading={loadingStates.create}>Create</LoadingButton>
 */
export function useMultipleLoadingStates<T extends string = string>() {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>(
    {},
  );

  const setLoading = useCallback((key: T, loading: boolean) => {
    setLoadingStates((prev) => ({ ...prev, [key]: loading }));
  }, []);

  const executeAsync = useCallback(
    <R>(key: T, asyncFn: () => Promise<R>) => {
      return async (): Promise<R | undefined> => {
        setLoading(key, true);
        try {
          const result = await asyncFn();
          return result;
        } catch (error) {
          throw error;
        } finally {
          setLoading(key, false);
        }
      };
    },
    [setLoading],
  );

  const isLoading = useCallback(
    (key: T) => loadingStates[key] || false,
    [loadingStates],
  );

  return {
    loadingStates,
    setLoading,
    executeAsync,
    isLoading,
  };
}
