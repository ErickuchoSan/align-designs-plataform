import { useState, useCallback } from 'react';
import { handleApiError } from '@/lib/errors';
import { Project, File, FileFilters } from '@/types';
import { ProjectsService } from '@/services/projects.service';
import { FilesService } from '@/services/files.service';

// Use Project type from types index
export type ProjectData = Project;
// Export File type alias for backward compatibility or direct usage
export type FileData = File;

export function useProjectFiles(projectId: string) {
  const [project, setProject] = useState<ProjectData | null>(null);
  const [files, setFiles] = useState<FileData[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<FileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filter state
  const [nameFilter, setNameFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [availableTypes, setAvailableTypes] = useState<string[]>([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchProjectDetails = useCallback(async () => {
    try {
      // Parallelize service calls for better performance
      const [project, types] = await Promise.all([
        ProjectsService.getById(projectId),
        FilesService.getProjectFileTypes(projectId),
      ]);

      setProject(project);
      setAvailableTypes(types || []);
    } catch (error) {
      setError(handleApiError(error, 'Error loading project'));
    }
  }, [projectId]);

  const fetchFiles = useCallback(async () => {
    try {
      setLoading(true);
      const params: Partial<FileFilters> = {
        page: currentPage,
        limit: itemsPerPage,
      };

      // Add filters if active
      if (nameFilter) params.name = nameFilter;
      if (typeFilter && typeFilter !== 'all') params.type = typeFilter;

      const result = await FilesService.getProjectFiles(projectId, params);
      setFiles(result.data || []);
      setTotalItems(result.meta?.total || 0);
      setTotalPages(result.meta?.totalPages || 0);
    } catch (error) {
      setError(handleApiError(error, 'Error loading files'));
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, [projectId, currentPage, itemsPerPage, nameFilter, typeFilter]);

  // Helper to refresh types (call after upload/delete)
  const refreshTypes = useCallback(async () => {
    try {
      const types = await FilesService.getProjectFileTypes(projectId);
      setAvailableTypes(types || []);
    } catch {
      // Silent error - file types refresh is non-critical
    }
  }, [projectId]);

  return {
    project,
    files,
    filteredFiles, // For backward compatibility, map to files or remove usage
    loading,
    error,
    success,
    setFilteredFiles,
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
