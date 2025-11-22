import { useState, useCallback } from 'react';
import { Project } from '@/types';

interface ProjectFormData {
  name: string;
  description: string;
  clientId: string;
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
  });

  // Edit modal state
  const [showEditConfirm, setShowEditConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editFormData, setEditFormData] = useState<ProjectFormData>({
    name: '',
    description: '',
    clientId: '',
  });
  const [canChangeClient, setCanChangeClient] = useState(true);

  // Delete modal state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  const openCreateModal = useCallback(() => {
    setShowCreateModal(true);
    setCreateFormData({ name: '', description: '', clientId: '' });
  }, []);

  const closeCreateModal = useCallback(() => {
    setShowCreateModal(false);
    setCreateFormData({ name: '', description: '', clientId: '' });
  }, []);

  const openEditModal = useCallback((project: Project) => {
    setEditingProject(project);
    setEditFormData({
      name: project.name,
      description: project.description || '',
      clientId: project.client?.id || '',
    });
    setShowEditModal(true);

    // Determine if client can be changed
    const hasFilesOrComments = (project._count?.files || 0) > 0 || (project._count?.comments || 0) > 0;
    setCanChangeClient(!hasFilesOrComments);
  }, []);

  const closeEditModal = useCallback(() => {
    setShowEditModal(false);
    setEditingProject(null);
    setEditFormData({ name: '', description: '', clientId: '' });
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
