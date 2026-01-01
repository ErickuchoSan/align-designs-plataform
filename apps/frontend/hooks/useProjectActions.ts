import { useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { Project } from '@/types';
import { getErrorMessage } from '@/lib/errors';
import { MESSAGE_DURATION } from '@/lib/constants/ui.constants';

interface ProjectFormData {
  name: string;
  description: string;
  clientId: string;
  // Phase 1: Workflow fields
  employeeIds?: string[];
  initialAmountRequired?: number;
  deadlineDate?: string;
  initialPaymentDeadline?: string;
}

interface UseProjectActionsParams {
  onSuccess?: (message: string) => void;
  onError?: (error: string) => void;
  refetchProjects?: () => void;
}

/**
 * Hook for managing project CRUD operations (create, update, delete)
 */
export function useProjectActions({ onSuccess, onError, refetchProjects }: UseProjectActionsParams = {}) {
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const createProject = useCallback(
    async (formData: ProjectFormData) => {
      try {
        setCreating(true);
        // Temporary log to debug
        console.log('🚀 Frontend sending formData:', JSON.stringify(formData, null, 2));
        await api.post('/projects', formData);
        onSuccess?.('Project created successfully');
        refetchProjects?.();
        return true;
      } catch (err) {
        const errorMsg = getErrorMessage(err, 'Failed to create project');
        onError?.(errorMsg);
        return false;
      } finally {
        setCreating(false);
      }
    },
    [onSuccess, onError, refetchProjects]
  );

  const updateProject = useCallback(
    async (projectId: string, formData: ProjectFormData) => {
      try {
        setEditing(true);
        await api.patch(`/projects/${projectId}`, formData);
        onSuccess?.('Project updated successfully');
        refetchProjects?.();
        return true;
      } catch (err) {
        const errorMsg = getErrorMessage(err, 'Failed to update project');
        onError?.(errorMsg);
        return false;
      } finally {
        setEditing(false);
      }
    },
    [onSuccess, onError, refetchProjects]
  );

  const deleteProject = useCallback(
    async (projectId: string) => {
      try {
        setDeleting(true);
        await api.delete(`/projects/${projectId}`);
        onSuccess?.('Project deleted successfully');
        refetchProjects?.();
        return true;
      } catch (err) {
        const errorMsg = getErrorMessage(err, 'Failed to delete project');
        onError?.(errorMsg);
        return false;
      } finally {
        setDeleting(false);
      }
    },
    [onSuccess, onError, refetchProjects]
  );

  return {
    creating,
    editing,
    deleting,
    createProject,
    updateProject,
    deleteProject,
  };
}
