'use client';
import { MESSAGE_DURATION } from '@/lib/constants/ui.constants';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { User, CreateClientDto } from '@/types';
import Modal from '@/app/components/Modal';
import ConfirmModal from '@/app/components/ConfirmModal';
import { ButtonLoader, PageLoader, TableRowSkeleton } from '@/app/components/Loader';
import PhoneInput from '@/app/components/PhoneInput';
import EmailInput from '@/app/components/EmailInput';
import DashboardHeader from '@/app/components/DashboardHeader';
import { formatDate } from '@/lib/utils/date.utils';

export default function UsersPage() {
  const { isAuthenticated, loading: authLoading, isAdmin } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
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
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (!isAdmin) {
        router.push('/dashboard');
      }
    }
  }, [isAuthenticated, isAdmin, authLoading, router]);

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      fetchUsers();
    }
  }, [isAuthenticated, isAdmin]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/users');
      setUsers(data.data);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Error loading users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
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
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Error creating client');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!userToToggle) return;

    setTogglingUserId(userToToggle.id);
    try {
      await api.patch(`/users/${userToToggle.id}/toggle-status`, { isActive: !userToToggle.isActive });
      setSuccess(`User ${!userToToggle.isActive ? 'activated' : 'deactivated'} successfully`);
      fetchUsers();
      setTimeout(() => setSuccess(''), MESSAGE_DURATION.SUCCESS);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Error changing status');
    } finally {
      setTogglingUserId(null);
      setShowToggleConfirm(false);
      setUserToToggle(null);
    }
  };

  const openToggleConfirm = (user: User) => {
    setUserToToggle(user);
    setShowToggleConfirm(true);
  };

  if (authLoading || (loading && users.length === 0)) {
    return <PageLoader text="Loading users..." />
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-stone-50 via-stone-100 to-stone-200">
        <DashboardHeader
          title="User Management"
          showBackButton
          backUrl="/dashboard"
        >
          <button
            onClick={() => setShowCreateForm(true)}
            className="rounded-lg bg-gradient-to-r from-gold-500 to-gold-600 px-5 py-2.5 text-sm font-semibold text-navy-900 hover:from-gold-400 hover:to-gold-500 transition-all transform hover:scale-105 shadow-lg hover:shadow-gold-300/50"
          >
            + New Client
          </button>
        </DashboardHeader>

        {/* Content */}
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {success && (
            <div className="mb-6 rounded-lg bg-emerald-50 border-l-4 border-emerald-500 p-4 shadow-md animate-slideDown">
              <p className="text-sm font-medium text-emerald-800">{success}</p>
            </div>
          )}

          {error && (
            <div className="mb-6 rounded-lg bg-red-50 border-l-4 border-red-500 p-4 shadow-md animate-slideDown">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          )}

          {/* Users Table */}
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-stone-200 animate-slideUp">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-stone-200">
                <thead className="bg-gradient-to-r from-navy-50 to-stone-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-navy-900 uppercase tracking-wider">User</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-navy-900 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-navy-900 uppercase tracking-wider">Phone</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-navy-900 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-navy-900 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-navy-900 uppercase tracking-wider">Created At</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-stone-200">
                  {loading && users.length === 0 ? (
                    <>
                      {[1, 2, 3].map((i) => (
                        <TableRowSkeleton key={i} />
                      ))}
                    </>
                  ) : (
                    users.filter(usr => usr.role === 'CLIENT').map((usr) => (
                    <tr key={usr.id} className="hover:bg-stone-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-semibold text-navy-900">{usr.firstName} {usr.lastName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-700">{usr.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-700">{usr.phone || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs font-semibold rounded-full ${
                          usr.role === 'ADMIN' ? 'bg-navy-100 text-navy-800 border border-navy-300' : 'bg-gold-100 text-gold-800 border border-gold-300'
                        }`}>
                          {usr.role === 'ADMIN' ? 'Admin' : 'Client'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {usr.role === 'CLIENT' ? (
                          <button
                            onClick={() => openToggleConfirm(usr)}
                            disabled={togglingUserId === usr.id}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                              usr.isActive ? 'bg-emerald-600' : 'bg-stone-300'
                            }`}
                            aria-label={`${usr.isActive ? 'Deactivate' : 'Activate'} user ${usr.firstName} ${usr.lastName}`}
                          >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              usr.isActive ? 'translate-x-6' : 'translate-x-1'
                            }`} />
                          </button>
                        ) : (
                          <span className="px-3 py-1 inline-flex text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-700">
                        {formatDate(usr.createdAt)}
                      </td>
                    </tr>
                  ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Create Client Modal */}
      <Modal
        isOpen={showCreateForm}
        onClose={() => {
          setShowCreateForm(false);
          setFormData({ email: '', firstName: '', lastName: '', phone: '' });
          setError('');
        }}
        title="Create New Client"
        size="md"
      >
        <form onSubmit={handleCreateClient} className="space-y-4">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-800 px-4 py-3 rounded-lg text-sm font-medium shadow-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-navy-900 mb-2">First Name</label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 transition-all text-navy-900 placeholder:text-stone-700"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-navy-900 mb-2">Last Name</label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 transition-all text-navy-900 placeholder:text-stone-700"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-navy-900 mb-2">Email</label>
            <EmailInput
              value={formData.email}
              onChange={(email) => setFormData({ ...formData, email })}
              placeholder="Email address"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-navy-900 mb-2">Phone</label>
            <PhoneInput
              value={formData.phone || ''}
              onChange={(phone) => setFormData({ ...formData, phone })}
              placeholder="Phone number"
            />
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={() => {
                setShowCreateForm(false);
                setFormData({ email: '', firstName: '', lastName: '', phone: '' });
                setError('');
              }}
              disabled={creating}
              className="px-5 py-2.5 text-sm font-medium text-stone-800 bg-stone-200 rounded-lg hover:bg-stone-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="px-5 py-2.5 text-sm font-semibold text-navy-900 bg-gradient-to-r from-gold-500 to-gold-600 rounded-lg hover:from-gold-400 hover:to-gold-500 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none min-w-[120px] flex items-center justify-center shadow-lg hover:shadow-gold-300/50"
            >
              {creating ? <ButtonLoader /> : 'Create Client'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Toggle Status Confirm Modal */}
      <ConfirmModal
        isOpen={showToggleConfirm}
        onClose={() => {
          setShowToggleConfirm(false);
          setUserToToggle(null);
        }}
        onConfirm={handleToggleStatus}
        title={`${userToToggle?.isActive ? 'Deactivate' : 'Activate'} User`}
        message={`Are you sure you want to ${userToToggle?.isActive ? 'deactivate' : 'activate'} ${userToToggle?.firstName} ${userToToggle?.lastName}?`}
        confirmText={userToToggle?.isActive ? 'Deactivate' : 'Activate'}
        isLoading={togglingUserId === userToToggle?.id}
        variant={userToToggle?.isActive ? 'warning' : 'info'}
      />
    </>
  );
}
