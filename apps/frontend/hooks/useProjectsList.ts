import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { Project } from '@/types';
import { logger } from '@/lib/logger';

/**
 * Hook for managing projects list, fetching, and pagination
 */
export function useProjectsList(isAuthenticated: boolean) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/projects', {
        params: {
          page: currentPage,
          limit: itemsPerPage,
        },
      });
      setProjects(data.data || []);
      setTotalItems(data.meta?.total || 0);
      setTotalPages(data.meta?.totalPages || 0);
      setError('');
    } catch (err) {
      logger.error('Error fetching projects:', err);
      setError('Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchProjects();
    }
  }, [isAuthenticated, fetchProjects]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleItemsPerPageChange = useCallback((limit: number) => {
    setItemsPerPage(limit);
    setCurrentPage(1); // Reset to first page when changing items per page
  }, []);

  return {
    projects,
    setProjects,
    loading,
    error,
    currentPage,
    itemsPerPage,
    totalItems,
    totalPages,
    handlePageChange,
    handleItemsPerPageChange,
    refetch: fetchProjects,
  };
}
