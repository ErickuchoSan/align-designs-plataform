import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { User, CreateClientDto, CreateUserDto } from '@/types';
import { handleApiError } from '@/lib/errors';
import { useAutoResetMessage } from './useAutoResetMessage';
import { usePagination } from './usePagination';

export function useUsers(isAuthenticated: boolean, isAdmin: boolean) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Auto-reset success messages
  useAutoResetMessage(success, setSuccess);

  // Use centralized pagination hook
  const pagination = usePagination();

  // Create form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState<CreateUserDto>({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'CLIENT',
  });
  const [creating, setCreating] = useState(false);

  // Toggle status state
  const [togglingUserId, setTogglingUserId] = useState<string | null>(null);
  const [showToggleConfirm, setShowToggleConfirm] = useState(false);
  const [userToToggle, setUserToToggle] = useState<User | null>(null);

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      fetchUsers();
    }
  }, [isAuthenticated, isAdmin, pagination.currentPage, pagination.itemsPerPage]);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/users', {
        params: {
          page: pagination.currentPage,
          limit: pagination.itemsPerPage,
        },
      });
      setUsers(data.data || []);
      pagination.setTotalItems(data.meta?.total || 0);
      pagination.setTotalPages(data.meta?.totalPages || 0);
      setError('');
    } catch (err) {
      setError(handleApiError(err, 'Error loading users'));
    } finally {
      setLoading(false);
    }
  }, [pagination.currentPage, pagination.itemsPerPage, pagination]);

  const handleCreateClient = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setCreating(true);
      setError('');

      try {
        await api.post('/users', formData);
        setShowCreateForm(false);
        setFormData({ email: '', firstName: '', lastName: '', phone: '', role: 'CLIENT' });
        setSuccess(`${formData.role === 'CLIENT' ? 'Client' : 'Employee'} created successfully`);
        fetchUsers();
      } catch (err) {
        setError(handleApiError(err, `Error creating ${formData.role === 'CLIENT' ? 'client' : 'employee'}`));
      } finally {
        setCreating(false);
      }
    },
    [formData, fetchUsers]
  );

  const openToggleConfirm = useCallback((user: User) => {
    setUserToToggle(user);
    setShowToggleConfirm(true);
  }, []);

  const handleToggleStatus = useCallback(async () => {
    if (!userToToggle) return;

    setTogglingUserId(userToToggle.id);
    try {
      await api.patch(`/users/${userToToggle.id}/toggle-status`, {
        isActive: !userToToggle.isActive,
      });
      setSuccess(
        `User ${!userToToggle.isActive ? 'activated' : 'deactivated'} successfully`
      );
      setShowToggleConfirm(false);
      setUserToToggle(null);
      fetchUsers();
    } catch (err) {
      setError(handleApiError(err, 'Error changing status'));
    } finally {
      setTogglingUserId(null);
    }
  }, [userToToggle, fetchUsers]);

  const closeToggleConfirm = useCallback(() => {
    setShowToggleConfirm(false);
    setUserToToggle(null);
  }, []);

  // Delete user state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  const openDeleteConfirm = useCallback((user: User) => {
    setUserToDelete(user);
    setShowDeleteConfirm(true);
  }, []);

  const closeDeleteConfirm = useCallback(() => {
    setShowDeleteConfirm(false);
    setUserToDelete(null);
  }, []);

  const handleDeleteUser = useCallback(async () => {
    if (!userToDelete) return;

    setDeletingUserId(userToDelete.id);
    try {
      // Pass hard=true to permanent delete
      await api.delete(`/users/${userToDelete.id}`, {
        params: { hard: true },
      });
      setSuccess('User permanently deleted');
      setShowDeleteConfirm(false);
      setUserToDelete(null);
      fetchUsers();
    } catch (err) {
      setError(handleApiError(err, 'Error deleting user'));
    } finally {
      setDeletingUserId(null);
    }
  }, [userToDelete, fetchUsers]);

  // Edit user state
  const [showEditModal, setShowEditModal] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [editError, setEditError] = useState(''); // Separate error for modal
  const [editFormData, setEditFormData] = useState<Partial<User>>({
    firstName: '',
    lastName: '',
    phone: '',
  });
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const openEditModal = useCallback((user: User) => {
    setUserToEdit(user);
    setEditFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone || '',
    });
    setEditError(''); // Clear modal error
    setError(''); // Clear page error
    setShowEditModal(true);
  }, []);

  const closeEditModal = useCallback(() => {
    setShowEditModal(false);
    setUserToEdit(null);
    setEditFormData({ firstName: '', lastName: '', phone: '' });
    setEditError(''); // Clear modal error
  }, []);

  const handleUpdateUser = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!userToEdit) return;

      setUpdatingUserId(userToEdit.id);
      setEditError(''); // Clear modal error

      try {
        await api.put(`/users/${userToEdit.id}`, editFormData);
        setSuccess('User updated successfully');
        closeEditModal();
        fetchUsers();
      } catch (err) {
        setEditError(handleApiError(err, 'Error updating user')); // Set modal error only
      } finally {
        setUpdatingUserId(null);
      }
    },
    [userToEdit, editFormData, fetchUsers, closeEditModal]
  );

  return {
    // State
    users,
    loading,
    error,
    success,
    // Pagination (spread all pagination state and handlers)
    ...pagination,
    // Create form
    showCreateForm,
    setShowCreateForm,
    formData,
    setFormData,
    creating,
    handleCreateClient,
    // Toggle status
    togglingUserId,
    showToggleConfirm,
    userToToggle,
    openToggleConfirm,
    handleToggleStatus,
    closeToggleConfirm,
    // Delete
    showDeleteConfirm,
    userToDelete,
    deletingUserId,
    openDeleteConfirm,
    closeDeleteConfirm,
    handleDeleteUser,
    // Edit
    showEditModal,
    userToEdit,
    editError,
    editFormData,
    setEditFormData,
    updatingUserId,
    openEditModal,
    closeEditModal,
    handleUpdateUser,
  };
}
