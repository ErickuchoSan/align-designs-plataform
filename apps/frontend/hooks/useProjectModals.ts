import { useState, useCallback } from 'react';
import { Project } from '@/types';

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

/**
 * Hook for managing project modal states (create, edit, delete)
 */
export function useProjectModals() {
  // Create modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createFormData, setCreateFormData] = useState<ProjectFormData>({
    name: '',
    description: '',
    clientId: '',
    employeeIds: [],
    initialAmountRequired: undefined,
    deadlineDate: undefined,
    initialPaymentDeadline: undefined,
  });

  // Edit modal state
  const [showEditConfirm, setShowEditConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editFormData, setEditFormData] = useState<ProjectFormData>({
    name: '',
    description: '',
    clientId: '',
    employeeIds: [],
  });
  const [canChangeClient, setCanChangeClient] = useState(true);

  // Delete modal state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  const openCreateModal = useCallback(() => {
    setShowCreateModal(true);
    setCreateFormData({
      name: '',
      description: '',
      clientId: '',
      employeeIds: [],
      initialAmountRequired: undefined,
      deadlineDate: undefined,
      initialPaymentDeadline: undefined,
    });
  }, []);

  const closeCreateModal = useCallback(() => {
    setShowCreateModal(false);
    setCreateFormData({
      name: '',
      description: '',
      clientId: '',
      employeeIds: [],
      initialAmountRequired: undefined,
      deadlineDate: undefined,
      initialPaymentDeadline: undefined,
    });
  }, []);

  const openEditModal = useCallback((project: Project) => {
    setEditingProject(project);
    setEditFormData({
      name: project.name,
      description: project.description || '',
      clientId: project.client?.id || '',
      employeeIds: project.employees?.map((e: any) => e.employee.id) || [],
      initialAmountRequired: project.initialAmountRequired ? Number(project.initialAmountRequired) : undefined,
      deadlineDate: project.deadlineDate || undefined,
      initialPaymentDeadline: project.initialPaymentDeadline || undefined,
    });
    setShowEditModal(true);

    // Determine if client can be changed
    const hasFilesOrComments = (project._count?.files || 0) > 0 || (project._count?.comments || 0) > 0;
    setCanChangeClient(!hasFilesOrComments);
  }, []);

  const closeEditModal = useCallback(() => {
    setShowEditModal(false);
    setEditingProject(null);
    setEditFormData({
      name: '',
      description: '',
      clientId: '',
      employeeIds: [],
      initialAmountRequired: undefined,
      deadlineDate: undefined,
      initialPaymentDeadline: undefined,
    });
    setShowEditConfirm(false);
    setCanChangeClient(true);
  }, []);

  const openDeleteConfirm = useCallback((project: Project) => {
    setProjectToDelete(project);
    setShowDeleteConfirm(true);
  }, []);

  const closeDeleteConfirm = useCallback(() => {
    setShowDeleteConfirm(false);
    setProjectToDelete(null);
  }, []);

  return {
    // Create modal
    showCreateModal,
    setShowCreateModal,
    createFormData,
    setCreateFormData,
    openCreateModal,
    closeCreateModal,

    // Edit modal
    showEditConfirm,
    setShowEditConfirm,
    showEditModal,
    setShowEditModal,
    editingProject,
    setEditingProject,
    editFormData,
    setEditFormData,
    canChangeClient,
    setCanChangeClient,
    openEditModal,
    closeEditModal,

    // Delete modal
    showDeleteConfirm,
    setShowDeleteConfirm,
    projectToDelete,
    setProjectToDelete,
    openDeleteConfirm,
    closeDeleteConfirm,
  };
}
