import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { logger } from '@/lib/logger';
import { useProjectsList } from './useProjectsList';
import { useProjectModals } from './useProjectModals';
import { useProjectActions } from './useProjectActions';
import { useAutoResetMessage } from './useAutoResetMessage';

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

/**
 * Main hook for project management
 * Composed of smaller, focused hooks for better maintainability
 *
 * This hook has been refactored from 253 lines to ~90 lines by extracting
 * logic into specialized hooks:
 * - useProjectsList: Fetching and pagination
 * - useProjectModals: Modal state management
 * - useProjectActions: CRUD operations
 */
export function useProjects(isAuthenticated: boolean, userRole?: string) {
  const [clients, setClients] = useState<Client[]>([]);
  const [success, setSuccess] = useState('');

  // Auto-reset success messages
  useAutoResetMessage(success, setSuccess);

  // Use composed hooks for specific responsibilities
  const projectsList = useProjectsList(isAuthenticated);
  const modals = useProjectModals();

  const handleSuccess = useCallback((message: string) => {
    setSuccess(message);
  }, []);

  const actions = useProjectActions({
    onSuccess: handleSuccess,
    onError: (error) => {
      // Error is already set by projectsList hook
    },
    refetchProjects: projectsList.refetch,
  });

  useEffect(() => {
    if (isAuthenticated && userRole === 'ADMIN') {
      fetchClients();
    }
  }, [isAuthenticated, userRole]);

  const fetchClients = async () => {
    try {
      const { data } = await api.get('/users');
      const clientUsers = data.data.filter((u: { role: string }) => u.role === 'CLIENT');
      setClients(clientUsers);
    } catch (err) {
      logger.error('Error loading clients:', err);
    }
  };

  // Simplified handlers using composed hooks
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await actions.createProject(modals.createFormData);
    if (result) {
      modals.closeCreateModal();
    }
  };

  const handleEditProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modals.editingProject) return;
    const result = await actions.updateProject(modals.editingProject.id, modals.editFormData);
    if (result) {
      modals.closeEditModal();
    }
  };

  const handleDeleteProject = async () => {
    if (!modals.projectToDelete) return;
    const result = await actions.deleteProject(modals.projectToDelete.id);
    if (result) {
      modals.closeDeleteConfirm();
    }
  };

  return {
    // State
    projects: projectsList.projects,
    clients,
    loading: projectsList.loading,
    error: projectsList.error,
    success,

    // Pagination
    currentPage: projectsList.currentPage,
    setCurrentPage: projectsList.handlePageChange,
    itemsPerPage: projectsList.itemsPerPage,
    setItemsPerPage: projectsList.handleItemsPerPageChange,
    totalItems: projectsList.totalItems,
    totalPages: projectsList.totalPages,

    // Create modal
    showCreateModal: modals.showCreateModal,
    setShowCreateModal: modals.setShowCreateModal,
    createFormData: modals.createFormData,
    setCreateFormData: modals.setCreateFormData,
    creating: actions.creating,
    closeCreateModal: modals.closeCreateModal,
    handleCreateProject,

    // Edit modal
    showEditConfirm: modals.showEditConfirm,
    setShowEditConfirm: modals.setShowEditConfirm,
    showEditModal: modals.showEditModal,
    editingProject: modals.editingProject,
    setEditingProject: modals.setEditingProject,
    editFormData: modals.editFormData,
    setEditFormData: modals.setEditFormData,
    editing: actions.editing,
    closeEditModal: modals.closeEditModal,
    handleEditProject,
    openEditConfirm: (project) => {
      modals.setEditingProject(project);
      modals.setShowEditConfirm(true);
    },
    confirmEdit: () => {
      if (modals.editingProject) {
        modals.openEditModal(modals.editingProject);
        modals.setShowEditConfirm(false);
      }
    },
    canChangeClient: modals.canChangeClient,

    // Delete modal
    showDeleteConfirm: modals.showDeleteConfirm,
    setShowDeleteConfirm: modals.setShowDeleteConfirm,
    projectToDelete: modals.projectToDelete,
    setProjectToDelete: modals.setProjectToDelete,
    deleting: actions.deleting,
    openDeleteConfirm: modals.openDeleteConfirm,
    handleDeleteProject,
  };
}
