import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { Project } from '@/types';
import { logger } from '@/lib/logger';
import { usePagination } from './usePagination';

/**
 * Hook for managing projects list, fetching, and pagination
 */
export function useProjectsList(isAuthenticated: boolean) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Use centralized pagination hook
  const pagination = usePagination();

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/projects', {
        params: {
          page: pagination.currentPage,
          limit: pagination.itemsPerPage,
        },
      });
      setProjects(data.data || []);
      pagination.setTotalItems(data.meta?.total || 0);
      pagination.setTotalPages(data.meta?.totalPages || 0);
      setError('');
    } catch (err) {
      logger.error('Error fetching projects:', err);
      setError('Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, [pagination.currentPage, pagination.itemsPerPage, pagination]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchProjects();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, pagination.currentPage, pagination.itemsPerPage]);

  return {
    projects,
    setProjects,
    loading,
    error,
    ...pagination,
    refetch: fetchProjects,
  };
}
