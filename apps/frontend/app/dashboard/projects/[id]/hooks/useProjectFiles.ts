import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Project, File } from '@/types';
import {
  useProjectQuery,
  useProjectFilesQuery,
  useProjectFileTypesQuery,
} from '@/hooks/queries';
import { queryKeys } from '@/lib/query-keys';

// Use Project type from types index
export type ProjectData = Project;
// Export File type alias for backward compatibility or direct usage
export type FileData = File;

export function useProjectFiles(projectId: string) {
  const queryClient = useQueryClient();

  // Local state for UI messages (success/error)
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filter state
  const [nameFilter, setNameFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // TanStack Query: fetch project details
  const {
    data: project = null,
    isLoading: projectLoading,
    error: projectError,
  } = useProjectQuery(projectId);

  // TanStack Query: fetch file types
  const { data: availableTypes = [], refetch: refetchTypes } = useProjectFileTypesQuery(projectId);

  // TanStack Query: fetch files with pagination and filters
  const {
    data: filesResult,
    isLoading: filesLoading,
    error: filesError,
    refetch: refetchFiles,
  } = useProjectFilesQuery(projectId, {
    page: currentPage,
    limit: itemsPerPage,
    name: nameFilter || undefined,
    type: typeFilter !== 'all' ? typeFilter : undefined,
  });

  // Derived state from query results
  const files = filesResult?.data || [];
  const totalItems = filesResult?.meta?.total || 0;
  const totalPages = filesResult?.meta?.totalPages || 0;
  const loading = projectLoading || filesLoading;

  // Handle query errors
  useEffect(() => {
    if (projectError) {
      setError(projectError.message || 'Error loading project');
    }
    if (filesError) {
      setError((filesError as Error).message || 'Error loading files');
    }
  }, [projectError, filesError]);

  // Wrapper functions for backward compatibility
  const fetchProjectDetails = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(projectId) });
    await refetchTypes();
  };

  const fetchFiles = async () => {
    await refetchFiles();
  };

  const refreshTypes = async () => {
    await refetchTypes();
  };

  return {
    project,
    files,
    filteredFiles: files, // For backward compatibility
    loading,
    error,
    success,
    setFilteredFiles: () => {}, // No-op for backward compatibility
    setError,
    setSuccess,
    fetchProjectDetails,
    fetchFiles,
    // Pagination
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    totalItems,
    totalPages,
    // Filters
    nameFilter,
    setNameFilter,
    typeFilter,
    setTypeFilter,
    availableTypes,
    refreshTypes,
  };
}