import { useState, useCallback, useEffect } from 'react';
import { User, CreateUserDto, Role } from '@/types';
import { handleApiError } from '@/lib/errors';
import { usePagination } from './usePagination';
import { toast } from '@/lib/toast';
import {
  useUsersListQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useToggleUserStatusMutation,
  useDeleteUserMutation,
  useResendWelcomeEmailMutation,
} from './queries';

export function useUsers(isAuthenticated: boolean, isAdmin: boolean) {
  // Use centralized pagination hook
  const pagination = usePagination();

  // TanStack Query for data fetching
  const {
    data,
    isLoading,
    error: queryError,
  } = useUsersListQuery(
    {
      page: pagination.currentPage,
      limit: pagination.itemsPerPage,
    },
    { enabled: isAuthenticated && isAdmin }
  );

  // Sync pagination totals from API response
  useEffect(() => {
    if (data) {
      pagination.setTotalItems(data.meta?.total || 0);
      pagination.setTotalPages(data.meta?.totalPages || 0);
    }
  }, [data, pagination]);

  const users: User[] = data?.data || [];
  const [error, setError] = useState('');

  // Create form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState<CreateUserDto>({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: Role.CLIENT,
  });

  // Create mutation
  const createMutation = useCreateUserMutation();

  const handleCreateClient = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');

      try {
        await createMutation.mutateAsync(formData);
        setShowCreateForm(false);
        setFormData({ email: '', firstName: '', lastName: '', phone: '', role: Role.CLIENT });
      } catch (err) {
        setError(handleApiError(err, `Error creating ${formData.role === Role.CLIENT ? 'client' : 'employee'}`));
      }
    },
    [formData, createMutation]
  );

  // Toggle status state
  const [showToggleConfirm, setShowToggleConfirm] = useState(false);
  const [userToToggle, setUserToToggle] = useState<User | null>(null);

  const toggleMutation = useToggleUserStatusMutation();

  const openToggleConfirm = useCallback((user: User) => {
    setUserToToggle(user);
    setShowToggleConfirm(true);
  }, []);

  const handleToggleStatus = useCallback(async () => {
    if (!userToToggle) return;

    try {
      await toggleMutation.mutateAsync({
        id: userToToggle.id,
        isActive: !userToToggle.isActive,
      });
      setShowToggleConfirm(false);
      setUserToToggle(null);
    } catch (err) {
      setError(handleApiError(err, 'Error changing status'));
    }
  }, [userToToggle, toggleMutation]);

  const closeToggleConfirm = useCallback(() => {
    setShowToggleConfirm(false);
    setUserToToggle(null);
  }, []);

  // Delete user state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showForceDeleteConfirm, setShowForceDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const deleteMutation = useDeleteUserMutation();

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

    try {
      await deleteMutation.mutateAsync({ id: userToDelete.id, force });
      setShowDeleteConfirm(false);
      setShowForceDeleteConfirm(false);
      setUserToDelete(null);
    } catch (err: any) {
      if (!force && err.response?.status === 409) {
        // If 409 Conflict, show Force Delete Confirmation
        setShowForceDeleteConfirm(true);
        setShowDeleteConfirm(false);
      } else {
        setError(handleApiError(err, 'Error deleting user'));
      }
    }
  }, [userToDelete, deleteMutation]);

  // Edit user state
  const [showEditModal, setShowEditModal] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [editError, setEditError] = useState('');
  const [editFormData, setEditFormData] = useState<Partial<User>>({
    firstName: '',
    lastName: '',
    phone: '',
  });

  const updateMutation = useUpdateUserMutation();

  const openEditModal = useCallback((user: User) => {
    setUserToEdit(user);
    setEditFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone || '',
    });
    setEditError('');
    setError('');
    setShowEditModal(true);
  }, []);

  const closeEditModal = useCallback(() => {
    setShowEditModal(false);
    setUserToEdit(null);
    setEditFormData({ firstName: '', lastName: '', phone: '' });
    setEditError('');
  }, []);

  const handleUpdateUser = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!userToEdit) return;

      setEditError('');

      try {
        await updateMutation.mutateAsync({ id: userToEdit.id, data: editFormData });
        closeEditModal();
      } catch (err) {
        setEditError(handleApiError(err, 'Error updating user'));
      }
    },
    [userToEdit, editFormData, updateMutation, closeEditModal]
  );

  // Resend welcome email
  const resendMutation = useResendWelcomeEmailMutation();

  const handleResendWelcomeEmail = useCallback(async (user: User) => {
    try {
      await resendMutation.mutateAsync(user.id);
    } catch (err) {
      toast.error(handleApiError(err, 'Error sending welcome email'));
    }
  }, [resendMutation]);

  return {
    // State
    users,
    isLoading,
    error: error || queryError?.message || '',
    // Pagination
    ...pagination,
    // Create form
    showCreateForm,
    setShowCreateForm,
    formData,
    setFormData,
    isCreating: createMutation.isPending,
    handleCreateClient,
    // Toggle status
    togglingUserId: toggleMutation.isPending ? userToToggle?.id : null,
    showToggleConfirm,
    userToToggle,
    openToggleConfirm,
    handleToggleStatus,
    closeToggleConfirm,
    // Delete
    showDeleteConfirm,
    showForceDeleteConfirm,
    userToDelete,
    deletingUserId: deleteMutation.isPending ? userToDelete?.id : null,
    openDeleteConfirm,
    closeDeleteConfirm,
    handleDeleteUser,
    // Edit
    showEditModal,
    userToEdit,
    editError,
    editFormData,
    setEditFormData,
    updatingUserId: updateMutation.isPending ? userToEdit?.id : null,
    openEditModal,
    closeEditModal,
    handleUpdateUser,
    // Resend welcome email
    resendingUserId: resendMutation.isPending ? resendMutation.variables : null,
    handleResendWelcomeEmail,
  };
}