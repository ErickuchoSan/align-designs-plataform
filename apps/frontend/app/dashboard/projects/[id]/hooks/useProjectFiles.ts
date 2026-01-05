import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { handleApiError } from '@/lib/errors';
import { Project } from '@/types';
import { logger } from '@/lib/logger';

export interface FileData {
  id: string;
  filename: string | null;
  originalName: string | null;
  sizeBytes: number | null;
  mimeType: string | null;
  uploadedBy: string;
  comment?: string | null;
  uploader: {
    firstName: string;
    lastName: string;
    email: string;
  };
  uploadedAt: string;
  // Versioning & Tracking
  versionNumber?: number;
  versionLabel?: string;
  isCurrentVersion?: boolean;
  parentFileId?: string;
  rejectionCount?: number;
  stage?: string;
}

// Use Project type from types index
export type ProjectData = Project;

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
      // Parallelize API calls for better performance
      const [projectRes, typesRes] = await Promise.all([
        api.get(`/projects/${projectId}`),
        api.get(`/files/project/${projectId}/types`),
      ]);

      setProject(projectRes.data);
      setAvailableTypes(typesRes.data || []);
    } catch (error) {
      setError(handleApiError(error, 'Error loading project'));
    }
  }, [projectId]);

  const fetchFiles = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        limit: itemsPerPage,
      };

      // Add filters if active
      if (nameFilter) params.name = nameFilter;
      if (typeFilter && typeFilter !== 'all') params.type = typeFilter;

      const { data } = await api.get(`/files/project/${projectId}`, {
        params,
      });
      // Backend returns paginated response: { data: [...], meta: {...} }
      setFiles(data.data || []);
      setTotalItems(data.meta?.total || 0);
      setTotalPages(data.meta?.totalPages || 0);
    } catch (error) {
      setError(handleApiError(error, 'Error loading files'));
      setFiles([]); // Reset to empty array on error
    } finally {
      setLoading(false);
    }
  }, [projectId, currentPage, itemsPerPage, nameFilter, typeFilter]);

  // Helper to refresh types (call after upload/delete)
  const refreshTypes = useCallback(async () => {
    try {
      const { data } = await api.get(`/files/project/${projectId}/types`);
      setAvailableTypes(data || []);
    } catch (e) {
      logger.error('Failed to refresh file types', e, { projectId });
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
