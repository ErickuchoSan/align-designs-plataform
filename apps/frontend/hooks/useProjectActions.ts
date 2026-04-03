import { useState, useCallback } from 'react';
import { handleApiError } from '@/lib/errors';
import { ProjectsService } from '@/services/projects.service';
import { toast } from '@/lib/toast';

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
        await ProjectsService.create(formData);
        onSuccess?.('Project created successfully');
        refetchProjects?.();
        return true;
      } catch (err) {
        const errorMsg = handleApiError(err, 'Failed to create project');
        toast.error(errorMsg || 'Failed to create project');
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
        await ProjectsService.update(projectId, formData);
        onSuccess?.('Project updated successfully');
        refetchProjects?.();
        return true;
      } catch (err) {
        const errorMsg = handleApiError(err, 'Failed to update project');
        toast.error(errorMsg || 'Failed to update project');
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
        await ProjectsService.delete(projectId);
        onSuccess?.('Project deleted successfully');
        refetchProjects?.();
        return true;
      } catch (err) {
        const errorMsg = handleApiError(err, 'Failed to delete project');
        toast.error(errorMsg || 'Failed to delete project');
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
