import { useState, useEffect, useCallback } from 'react';
import { Project } from '@/types';
import { usePagination } from './usePagination';
import { ProjectsService } from '@/services/projects.service';

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
      const result = await ProjectsService.getAll({
        page: pagination.currentPage,
        limit: pagination.itemsPerPage,
      });
      setProjects(result.projects || []);
      pagination.setTotalItems(result.total || 0);
      pagination.setTotalPages(result.totalPages || 0);
      setError('');
    } catch {
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
