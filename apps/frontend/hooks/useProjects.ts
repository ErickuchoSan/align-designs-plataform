import { useState, useCallback } from 'react';
import { Project } from '@/types';
import { useProjectsList } from './useProjectsList';
import { useProjectModals } from './useProjectModals';
import { useProjectActions } from './useProjectActions';
import { useAutoResetMessage } from './useAutoResetMessage';
import { useClientsQuery, useAvailableEmployeesQuery } from './queries';
import { toast } from '@/lib/toast';

// Client type derived from Project interface to avoid duplication
// Uses TypeScript utility type to extract the client property type
type Client = NonNullable<Project['client']>;

/**
 * Main hook for project management
 * Composed of smaller, focused hooks for better maintainability
 *
 * Migrated to TanStack Query for automatic caching and refetching.
 */
export function useProjects(isAuthenticated: boolean, userRole?: string) {
  const [success, setSuccess] = useState('');

  // Auto-reset success messages
  useAutoResetMessage(success, setSuccess);

  // Use composed hooks for specific responsibilities
  const projectsList = useProjectsList(isAuthenticated);
  const modals = useProjectModals();

  // TanStack Query for clients and employees (only for ADMIN)
  const isAdmin = userRole === 'ADMIN';

  const { data: clients = [] } = useClientsQuery({
    enabled: isAuthenticated && isAdmin,
  });

  const {
    data: employees = [],
    refetch: refetchEmployees,
  } = useAvailableEmployeesQuery({
    enabled: isAuthenticated && isAdmin,
  });

  const handleSuccess = useCallback((message: string) => {
    setSuccess(message);
  }, []);

  const actions = useProjectActions({
    onSuccess: handleSuccess,
    onError: () => {
      // Error is already set by projectsList hook
    },
    refetchProjects: projectsList.refetch,
  });

  // Simplified handlers using composed hooks
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields before submission
    if (!modals.createFormData.name.trim()) {
      toast.error('Please enter a project name');
      return;
    }
    if (!modals.createFormData.clientId) {
      toast.error('Please select a client for this project');
      return;
    }

    const result = await actions.createProject(modals.createFormData);
    if (result) {
      modals.closeCreateModal();
    }
  };

  const handleEditProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modals.editingProject) return;

    // Validate required fields before submission
    if (!modals.editFormData.name.trim()) {
      toast.error('Please enter a project name');
      return;
    }
    if (!modals.editFormData.clientId) {
      toast.error('Please select a client for this project');
      return;
    }

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

  // Exposed handler to open modal AND refresh data
  const openCreateModal = () => {
    // TanStack Query will auto-refetch if stale
    refetchEmployees();
    modals.setShowCreateModal(true);
  };

  return {
    // State
    projects: projectsList.projects,
    clients: clients as Client[],
    employees: employees as Client[],
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
    openCreateModal,
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
    openEditConfirm: (project: Project) => {
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