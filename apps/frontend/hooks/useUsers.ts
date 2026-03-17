import { useState, useEffect, useCallback } from 'react';
import { User, CreateUserDto, Role } from '@/types';
import { handleApiError } from '@/lib/errors';
import { usePagination } from './usePagination';
import { toast } from '@/lib/toast';
import { UsersService } from '@/services/users.service';

export function useUsers(isAuthenticated: boolean, isAdmin: boolean) {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Use centralized pagination hook
  const pagination = usePagination();

  // Create form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState<CreateUserDto>({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: Role.CLIENT,
  });
  const [isCreating, setIsCreating] = useState(false);

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
      setIsLoading(true);
      const result = await UsersService.getAll({
        page: pagination.currentPage,
        limit: pagination.itemsPerPage,
      });
      setUsers(result.data || []);
      pagination.setTotalItems(result.meta?.total || 0);
      pagination.setTotalPages(result.meta?.totalPages || 0);
      setError('');
    } catch (err) {
      setError(handleApiError(err, 'Error loading users'));
    } finally {
      setIsLoading(false);
    }
  }, [pagination.currentPage, pagination.itemsPerPage, pagination]);

  const handleCreateClient = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setIsCreating(true);
      setError('');

      try {
        await UsersService.create(formData);
        setShowCreateForm(false);
        setFormData({ email: '', firstName: '', lastName: '', phone: '', role: Role.CLIENT });
        toast.success(`${formData.role === Role.CLIENT ? 'Client' : 'Employee'} created successfully`);
        fetchUsers();
      } catch (err) {
        setError(handleApiError(err, `Error creating ${formData.role === Role.CLIENT ? 'client' : 'employee'}`));
      } finally {
        setIsCreating(false);
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
      await UsersService.toggleStatus(userToToggle.id, !userToToggle.isActive);
      toast.success(
        `User ${userToToggle.isActive ? 'deactivated' : 'activated'} successfully`
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
  const [showForceDeleteConfirm, setShowForceDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  const openDeleteConfirm = useCallback((user: User) => {
    setUserToDelete(user);
    setShowDeleteConfirm(true);
    setShowForceDeleteConfirm(false);
  }, []);

  const closeDeleteConfirm = useCallback(() => {
    setShowDeleteConfirm(false);
    setShowForceDeleteConfirm(false);
    setUserToDelete(null);
  }, []);

  const handleDeleteUser = useCallback(async (force = false) => {
    if (!userToDelete) return;

    setDeletingUserId(userToDelete.id);
    try {
      await UsersService.delete(userToDelete.id, { hard: true, force });
      toast.success('User permanently deleted');
      setShowDeleteConfirm(false);
      setShowForceDeleteConfirm(false);
      setUserToDelete(null);
      fetchUsers();
    } catch (err: any) {
      if (!force && err.response?.status === 409) {
        // If 409 Conflict, show Force Delete Confirmation
        setShowForceDeleteConfirm(true);
        setShowDeleteConfirm(false);
      } else {
        setError(handleApiError(err, 'Error deleting user'));
      }
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
      setEditError('');

      try {
        await UsersService.update(userToEdit.id, editFormData);
        toast.success('User updated successfully');
        closeEditModal();
        fetchUsers();
      } catch (err) {
        setEditError(handleApiError(err, 'Error updating user'));
      } finally {
        setUpdatingUserId(null);
      }
    },
    [userToEdit, editFormData, fetchUsers, closeEditModal]
  );

  // Resend welcome email state
  const [resendingUserId, setResendingUserId] = useState<string | null>(null);

  const handleResendWelcomeEmail = useCallback(async (user: User) => {
    setResendingUserId(user.id);
    try {
      await UsersService.resendWelcomeEmail(user.id);
      toast.success(`Welcome email sent to ${user.email}`);
    } catch (err) {
      toast.error(handleApiError(err, 'Error sending welcome email'));
    } finally {
      setResendingUserId(null);
    }
  }, []);

  return {
    // State
    users,
    isLoading,
    error,
    // Pagination (spread all pagination state and handlers)
    ...pagination,
    // Create form
    showCreateForm,
    setShowCreateForm,
    formData,
    setFormData,
    isCreating,
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
    showForceDeleteConfirm,
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
    // Resend welcome email
    resendingUserId,
    handleResendWelcomeEmail,
  };
}
