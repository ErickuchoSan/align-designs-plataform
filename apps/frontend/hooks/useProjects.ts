import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Project } from '@/types';
import { logger } from '@/lib/logger';
import { MESSAGE_DURATION } from '@/lib/constants/ui.constants';
import { getErrorMessage } from '@/lib/errors';

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface ProjectFormData {
  name: string;
  description: string;
  clientId: string;
}

export function useProjects(isAuthenticated: boolean, userRole?: string) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Create modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createFormData, setCreateFormData] = useState<ProjectFormData>({
    name: '',
    description: '',
    clientId: '',
  });
  const [creating, setCreating] = useState(false);

  // Edit modal state
  const [showEditConfirm, setShowEditConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editFormData, setEditFormData] = useState<ProjectFormData>({
    name: '',
    description: '',
    clientId: '',
  });
  const [editing, setEditing] = useState(false);

  // Delete modal state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchProjects();
      if (userRole === 'ADMIN') {
        fetchClients();
      }
    }
  }, [isAuthenticated, userRole]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/projects');
      // Handle both response formats: data.data or data directly
      setProjects(Array.isArray(data) ? data : data.data);
      setError('');
    } catch (error) {
      setError(getErrorMessage(error, 'Error loading projects'));
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const { data } = await api.get('/users');
      // Handle both response formats: data.data or data directly
      const userData = Array.isArray(data) ? data : data.data;
      const clientUsers = userData.filter((u: { role: string }) => u.role === 'CLIENT');
      setClients(clientUsers);
    } catch (err) {
      logger.error('Error loading clients:', err);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError('');
    try {
      await api.post('/projects', createFormData);
      setSuccess('Project created successfully');
      setShowCreateModal(false);
      setCreateFormData({ name: '', description: '', clientId: '' });
      fetchProjects();
      setTimeout(() => setSuccess(''), MESSAGE_DURATION.SUCCESS);
    } catch (error) {
      setError(getErrorMessage(error, 'Error creating project'));
    } finally {
      setCreating(false);
    }
  };

  const openEditConfirm = (project: Project) => {
    setEditingProject(project);
    setShowEditConfirm(true);
  };

  const confirmEdit = () => {
    if (editingProject) {
      setEditFormData({
        name: editingProject.name,
        description: editingProject.description || '',
        clientId: editingProject.clientId || '',
      });
      setShowEditConfirm(false);
      setShowEditModal(true);
    }
  };

  const handleEditProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;
    setEditing(true);
    setError('');
    try {
      await api.patch(`/projects/${editingProject.id}`, editFormData);
      setSuccess('Project updated successfully');
      setShowEditModal(false);
      setEditingProject(null);
      fetchProjects();
      setTimeout(() => setSuccess(''), MESSAGE_DURATION.SUCCESS);
    } catch (error) {
      setError(getErrorMessage(error, 'Error updating project'));
    } finally {
      setEditing(false);
    }
  };

  const openDeleteConfirm = (project: Project) => {
    setProjectToDelete(project);
    setShowDeleteConfirm(true);
  };

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;
    setDeleting(true);
    setError('');
    try {
      await api.delete(`/projects/${projectToDelete.id}`);
      setSuccess('Project deleted successfully');
      setShowDeleteConfirm(false);
      setProjectToDelete(null);
      fetchProjects();
      setTimeout(() => setSuccess(''), MESSAGE_DURATION.SUCCESS);
    } catch (error) {
      setError(getErrorMessage(error, 'Error deleting project'));
    } finally {
      setDeleting(false);
    }
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setCreateFormData({ name: '', description: '', clientId: '' });
    setError('');
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingProject(null);
    setEditFormData({ name: '', description: '', clientId: '' });
    setError('');
  };

  return {
    // State
    projects,
    clients,
    loading,
    error,
    success,
    // Create modal
    showCreateModal,
    setShowCreateModal,
    createFormData,
    setCreateFormData,
    creating,
    closeCreateModal,
    handleCreateProject,
    // Edit modal
    showEditConfirm,
    setShowEditConfirm,
    showEditModal,
    editingProject,
    setEditingProject,
    editFormData,
    setEditFormData,
    editing,
    closeEditModal,
    handleEditProject,
    openEditConfirm,
    confirmEdit,
    // Delete modal
    showDeleteConfirm,
    setShowDeleteConfirm,
    projectToDelete,
    setProjectToDelete,
    deleting,
    handleDeleteProject,
    openDeleteConfirm,
  };
}
