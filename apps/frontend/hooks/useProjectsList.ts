import { useEffect } from 'react';
import { Project } from '@/types';
import { usePagination } from './usePagination';
import { useProjectsListQuery } from './queries';

/**
 * Hook for managing projects list, fetching, and pagination
 *
 * Migrated to TanStack Query for automatic caching, refetching, and better DX.
 * Maintains the same API as the original hook for backwards compatibility.
 */
export function useProjectsList(isAuthenticated: boolean) {
  // Use centralized pagination hook
  const pagination = usePagination();

  // Use TanStack Query for data fetching
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useProjectsListQuery(
    {
      page: pagination.currentPage,
      limit: pagination.itemsPerPage,
    },
    { enabled: isAuthenticated }
  );

  // Sync pagination totals from API response
  useEffect(() => {
    if (data) {
      pagination.setTotalItems(data.total || 0);
      pagination.setTotalPages(data.totalPages || 0);
    }
  }, [data, pagination]);

  // Extract projects from response
  const projects: Project[] = data?.projects || [];

  return {
    projects,
    setProjects: () => {
      // No-op: TanStack Query manages the data
      // Use refetch() or invalidate queries instead
    },
    loading: isLoading,
    error: error?.message || '',
    ...pagination,
    refetch,
  };
}