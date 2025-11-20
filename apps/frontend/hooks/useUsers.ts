import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { User, CreateClientDto } from '@/types';
import { MESSAGE_DURATION } from '@/lib/constants/ui.constants';
import { getErrorMessage } from '@/lib/errors';

export function useUsers(isAuthenticated: boolean, isAdmin: boolean) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Create form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState<CreateClientDto>({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
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
  }, [isAuthenticated, isAdmin, currentPage, itemsPerPage]);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/users', {
        params: {
          page: currentPage,
          limit: itemsPerPage,
        },
      });
      setUsers(data.data || []);
      setTotalItems(data.meta?.total || 0);
      setTotalPages(data.meta?.totalPages || 0);
      setError('');
    } catch (err) {
      setError(getErrorMessage(err, 'Error loading users'));
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage]);

  const handleCreateClient = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setCreating(true);
      setError('');

      try {
        await api.post('/users', formData);
        setShowCreateForm(false);
        setFormData({ email: '', firstName: '', lastName: '', phone: '' });
        setSuccess('Client created successfully');
        fetchUsers();
        setTimeout(() => setSuccess(''), MESSAGE_DURATION.SUCCESS);
      } catch (err) {
        setError(getErrorMessage(err, 'Error creating client'));
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
      setTimeout(() => setSuccess(''), MESSAGE_DURATION.SUCCESS);
    } catch (err) {
      setError(getErrorMessage(err, 'Error changing status'));
    } finally {
      setTogglingUserId(null);
    }
  }, [userToToggle, fetchUsers]);

  const closeToggleConfirm = useCallback(() => {
    setShowToggleConfirm(false);
    setUserToToggle(null);
  }, []);

  return {
    // State
    users,
    loading,
    error,
    success,
    // Pagination
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    totalItems,
    totalPages,
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
  };
}
