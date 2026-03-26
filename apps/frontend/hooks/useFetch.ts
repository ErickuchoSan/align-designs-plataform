import { useState, useEffect, useCallback, useRef } from 'react';
import { handleApiError } from '@/lib/errors';

export interface UseFetchOptions<T> {
  /** Initial data before fetch */
  initialData?: T;
  /** Auto-fetch on mount */
  immediate?: boolean;
  /** Dependencies that trigger refetch */
  deps?: unknown[];
  /** Error message prefix for logging */
  errorPrefix?: string;
  /** Callback on successful fetch */
  onSuccess?: (data: T) => void;
  /** Callback on error */
  onError?: (error: string) => void;
  /** Skip fetch if condition is false */
  enabled?: boolean;
}

export interface UseFetchReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<T | null>;
  setData: (data: T | null) => void;
  reset: () => void;
}

/**
 * Hook for fetching data with automatic loading/error handling
 * Eliminates repeated useEffect + try/catch + loading state patterns
 *
 * @example
 * // Basic usage - auto-fetch on mount
 * const { data, loading, error } = useFetch(
 *   () => UsersService.getAll(),
 *   { errorPrefix: 'Failed to load users' }
 * );
 *
 * @example
 * // With dependencies - refetch when projectId changes
 * const { data, loading, refetch } = useFetch(
 *   () => InvoicesService.getByProject(projectId),
 *   { deps: [projectId], enabled: !!projectId }
 * );
 *
 * @example
 * // Manual fetch only
 * const { data, loading, refetch } = useFetch(
 *   () => api.post('/search', query),
 *   { immediate: false }
 * );
 */
export function useFetch<T>(
  fetchFn: () => Promise<T>,
  options: UseFetchOptions<T> = {}
): UseFetchReturn<T> {
  const {
    initialData = null,
    immediate = true,
    deps = [],
    errorPrefix = 'Failed to load data',
    onSuccess,
    onError,
    enabled = true,
  } = options;

  const [data, setData] = useState<T | null>(initialData ?? null);
  const [loading, setLoading] = useState(immediate && enabled);
  const [error, setError] = useState<string | null>(null);

  // Track if component is mounted to prevent state updates after unmount
  const isMounted = useRef(true);

  const refetch = useCallback(async (): Promise<T | null> => {
    if (!enabled) return null;

    try {
      setLoading(true);
      setError(null);

      const result = await fetchFn();

      if (isMounted.current) {
        setData(result);
        setLoading(false);
        onSuccess?.(result);
      }

      return result;
    } catch (err) {
      const errorMessage = handleApiError(err, errorPrefix);

      if (isMounted.current) {
        setError(errorMessage);
        setLoading(false);
        onError?.(errorMessage);
      }

      return null;
    }
  }, [fetchFn, enabled, errorPrefix, onSuccess, onError]);

  const reset = useCallback(() => {
    setData(initialData ?? null);
    setLoading(false);
    setError(null);
  }, [initialData]);

  // Auto-fetch on mount and when deps change
  useEffect(() => {
    if (immediate && enabled) {
      refetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [immediate, enabled, ...deps]);

  // Cleanup on unmount
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  return {
    data,
    loading,
    error,
    refetch,
    setData,
    reset,
  };
}

/**
 * Hook for fetching data only when a modal/condition becomes active
 * Perfect for modals that need to fetch data when opened
 *
 * @example
 * const { data, loading } = useFetchOnOpen(
 *   isOpen,
 *   () => InvoicesService.getByProject(projectId),
 *   { deps: [projectId] }
 * );
 */
export function useFetchOnOpen<T>(
  isOpen: boolean,
  fetchFn: () => Promise<T>,
  options: Omit<UseFetchOptions<T>, 'enabled' | 'immediate'> = {}
): UseFetchReturn<T> {
  return useFetch(fetchFn, {
    ...options,
    immediate: true,
    enabled: isOpen,
  });
}

export default useFetch;
