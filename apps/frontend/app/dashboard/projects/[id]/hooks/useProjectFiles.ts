import { useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';

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
}

export interface ProjectData {
  id: string;
  name: string;
  description: string | null;
  clientId: string;
  client: {
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
  _count: {
    files: number;
  };
}

export function useProjectFiles(projectId: string) {
  const [project, setProject] = useState<ProjectData | null>(null);
  const [files, setFiles] = useState<FileData[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<FileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchProjectDetails = useCallback(async () => {
    try {
      const { data } = await api.get(`/projects/${projectId}`);
      setProject(data);
    } catch (error) {
      setError(getErrorMessage(error, 'Error loading project'));
    }
  }, [projectId]);

  const fetchFiles = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/files/project/${projectId}`);
      // Backend returns paginated response: { data: [...], meta: {...} }
      setFiles(data.data || []);
    } catch (error) {
      setError(getErrorMessage(error, 'Error loading files'));
      setFiles([]); // Reset to empty array on error
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  return {
    project,
    files,
    filteredFiles,
    loading,
    error,
    success,
    setFilteredFiles,
    setError,
    setSuccess,
    fetchProjectDetails,
    fetchFiles,
  };
}
