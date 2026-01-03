'use client';

import { useState, useMemo } from 'react';
import Modal from '@/app/components/Modal';
import ConfirmModal from '@/app/components/ConfirmModal';
import Pagination from '@/app/components/Pagination';
import { ButtonLoader, PageLoader, TableRowSkeleton } from '@/app/components/Loader';
import PhoneInput from '@/app/components/PhoneInput';
import EmailInput from '@/app/components/EmailInput';
import DashboardHeader from '@/app/components/DashboardHeader';
import { formatDate } from '@/lib/utils/date.utils';
import { useUsers } from '@/hooks/useUsers';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';

type TabType = 'clients' | 'employees';

export default function UsersManagementPage() {
  const { isAuthenticated, isAdmin, loading } = useProtectedRoute({ requireAdmin: true });
  const usersHook = useUsers(isAuthenticated, isAdmin || false);
  const [activeTab, setActiveTab] = useState<TabType>('clients');
  const [userRole, setUserRole] = useState<'CLIENT' | 'EMPLOYEE'>('CLIENT');

  // Memoize filtered users to avoid recalculating on every render
  // IMPORTANT: useMemo must be called before any early returns
  const filteredUsers = useMemo(
    () => usersHook.users.filter((usr) =>
      activeTab === 'clients' ? usr.role === 'CLIENT' : usr.role === 'EMPLOYEE'
    ),
    [usersHook.users, activeTab]
  );

  // Memoize user counts for tab labels to avoid filtering twice
  const clientCount = useMemo(
    () => usersHook.users.filter(u => u.role === 'CLIENT').length,
    [usersHook.users]
  );

  const employeeCount = useMemo(
    () => usersHook.users.filter(u => u.role === 'EMPLOYEE').length,
    [usersHook.users]
  );

  // Early return AFTER all hooks have been called
  if (loading || (usersHook.loading && usersHook.users.length === 0)) {
    return <PageLoader text="Loading users..." />;
  }

  const handleOpenCreateModal = (role: 'CLIENT' | 'EMPLOYEE') => {
    setUserRole(role);
    usersHook.setFormData({ ...usersHook.formData, role });
    usersHook.setShowCreateForm(true);
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-stone-50 via-stone-100 to-stone-200">
        <DashboardHeader
          title="User Management"
          showBackButton
          backUrl="/dashboard"
        >
          <button
            onClick={() => handleOpenCreateModal(activeTab === 'clients' ? 'CLIENT' : 'EMPLOYEE')}
            className="rounded-lg bg-gradient-to-r from-gold-500 to-gold-600 px-5 py-2.5 text-sm font-semibold text-navy-900 hover:from-gold-400 hover:to-gold-500 transition-all transform hover:scale-105 shadow-lg hover:shadow-gold-300/50"
          >
            + New {activeTab === 'clients' ? 'Client' : 'Employee'}
          </button>
        </DashboardHeader>

        {/* Content */}
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {usersHook.success && (
            <div className="mb-6 rounded-lg bg-emerald-50 border-l-4 border-emerald-500 p-4 shadow-md animate-slideDown">
              <p className="text-sm font-medium text-emerald-800">{usersHook.success}</p>
            </div>
          )}

          {usersHook.error && (
            <div className="mb-6 rounded-lg bg-red-50 border-l-4 border-red-500 p-4 shadow-md animate-slideDown">
              <p className="text-sm font-medium text-red-800">{usersHook.error}</p>
            </div>
          )}

          {/* Tabs */}
          <div className="mb-6">
            <div className="border-b border-stone-300">
              <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab('clients')}
                  className={`
                    whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                    ${activeTab === 'clients'
                      ? 'border-gold-500 text-gold-600'
                      : 'border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300'
                    }
                  `}
                >
                  Clients ({clientCount})
                </button>
                <button
                  onClick={() => setActiveTab('employees')}
                  className={`
                    whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                    ${activeTab === 'employees'
                      ? 'border-gold-500 text-gold-600'
                      : 'border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300'
                    }
                  `}
                >
                  Employees ({employeeCount})
                </button>
              </nav>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-stone-200 animate-slideUp">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-stone-200">
                <thead className="bg-gradient-to-r from-navy-50 to-stone-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-navy-900 uppercase tracking-wider">User</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-navy-900 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-navy-900 uppercase tracking-wider">Phone</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-navy-900 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-navy-900 uppercase tracking-wider">Created At</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-navy-900 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-stone-200">
                  {usersHook.loading && usersHook.users.length === 0 ? (
                    <>
                      {[1, 2, 3].map((i) => (
                        <TableRowSkeleton key={i} />
                      ))}
                    </>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-stone-500">
                        No {activeTab} found.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((usr) => (
                      <tr key={usr.id} className="hover:bg-stone-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-semibold text-navy-900">
                            {usr.firstName} {usr.lastName}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-700">
                          {usr.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-700">
                          {usr.phone || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => usersHook.openToggleConfirm(usr)}
                            disabled={usersHook.togglingUserId === usr.id}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${usr.isActive ? 'bg-emerald-600' : 'bg-stone-300'
                              }`}
                            aria-label={`${usr.isActive ? 'Deactivate' : 'Activate'} user ${usr.firstName} ${usr.lastName}`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${usr.isActive ? 'translate-x-6' : 'translate-x-1'
                                }`}
                            />
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-700">
                          {formatDate(usr.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => usersHook.openEditModal(usr)}
                              className="text-navy-600 hover:text-navy-900 transition-colors p-2 rounded-full hover:bg-navy-50"
                              aria-label={`Edit user ${usr.firstName} ${usr.lastName}`}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                              </svg>
                            </button>
                            <button
                              onClick={() => usersHook.openDeleteConfirm(usr)}
                              disabled={usersHook.deletingUserId === usr.id}
                              className="text-red-600 hover:text-red-900 transition-colors p-2 rounded-full hover:bg-red-50"
                              aria-label={`Delete user ${usr.firstName} ${usr.lastName}`}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {usersHook.totalPages > 0 && (
              <Pagination
                currentPage={usersHook.currentPage}
                totalPages={usersHook.totalPages}
                totalItems={usersHook.totalItems}
                itemsPerPage={usersHook.itemsPerPage}
                onPageChange={usersHook.setCurrentPage}
                onItemsPerPageChange={usersHook.setItemsPerPage}
              />
            )}
          </div>
        </main>
      </div>

      {/* Create User Modal */}
      <Modal
        isOpen={usersHook.showCreateForm}
        onClose={() => {
          usersHook.setShowCreateForm(false);
          usersHook.setFormData({ email: '', firstName: '', lastName: '', phone: '', role: 'CLIENT' });
        }}
        title={`Create New ${userRole === 'CLIENT' ? 'Client' : 'Employee'}`}
        size="md"
      >
        <form onSubmit={usersHook.handleCreateClient} className="space-y-4">
          {usersHook.error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-800 px-4 py-3 rounded-lg text-sm font-medium shadow-sm">
              {usersHook.error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-navy-900 mb-2">
                First Name
              </label>
              <input
                type="text"
                required
                value={usersHook.formData.firstName}
                onChange={(e) =>
                  usersHook.setFormData({ ...usersHook.formData, firstName: e.target.value })
                }
                className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 transition-all text-navy-900 placeholder:text-stone-700"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-navy-900 mb-2">
                Last Name
              </label>
              <input
                type="text"
                required
                value={usersHook.formData.lastName}
                onChange={(e) =>
                  usersHook.setFormData({ ...usersHook.formData, lastName: e.target.value })
                }
                className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 transition-all text-navy-900 placeholder:text-stone-700"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-navy-900 mb-2">Email</label>
            <EmailInput
              value={usersHook.formData.email}
              onChange={(email) => usersHook.setFormData({ ...usersHook.formData, email })}
              placeholder="Email address"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-navy-900 mb-2">Phone</label>
            <PhoneInput
              value={usersHook.formData.phone || ''}
              onChange={(phone) => usersHook.setFormData({ ...usersHook.formData, phone })}
              placeholder="Phone number"
            />
          </div>

          {/* Hidden field for role */}
          <input type="hidden" value={userRole} />

          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={() => {
                usersHook.setShowCreateForm(false);
                usersHook.setFormData({ email: '', firstName: '', lastName: '', phone: '', role: 'CLIENT' });
              }}
              disabled={usersHook.creating}
              className="px-5 py-2.5 text-sm font-medium text-stone-800 bg-stone-200 rounded-lg hover:bg-stone-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={usersHook.creating}
              className="px-5 py-2.5 text-sm font-semibold text-navy-900 bg-gradient-to-r from-gold-500 to-gold-600 rounded-lg hover:from-gold-400 hover:to-gold-500 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none min-w-[120px] flex items-center justify-center shadow-lg hover:shadow-gold-300/50"
            >
              {usersHook.creating ? <ButtonLoader /> : `Create ${userRole === 'CLIENT' ? 'Client' : 'Employee'}`}
            </button>
          </div>
        </form>
      </Modal>

      {/* Toggle Status Confirm Modal */}
      <ConfirmModal
        isOpen={usersHook.showToggleConfirm}
        onClose={usersHook.closeToggleConfirm}
        onConfirm={usersHook.handleToggleStatus}
        title={`${usersHook.userToToggle?.isActive ? 'Deactivate' : 'Activate'} User`}
        message={`Are you sure you want to ${usersHook.userToToggle?.isActive ? 'deactivate' : 'activate'} ${usersHook.userToToggle?.firstName} ${usersHook.userToToggle?.lastName}?`}
        confirmText={usersHook.userToToggle?.isActive ? 'Deactivate' : 'Activate'}
        isLoading={usersHook.togglingUserId === usersHook.userToToggle?.id}
        variant={usersHook.userToToggle?.isActive ? 'warning' : 'info'}
      />

      {/* Hard Delete Confirm Modal */}
      <ConfirmModal
        isOpen={usersHook.showDeleteConfirm}
        onClose={usersHook.closeDeleteConfirm}
        onConfirm={usersHook.handleDeleteUser}
        title="Delete User Permanently"
        message={`Are you sure you want to PERMANENTLY delete ${usersHook.userToDelete?.firstName} ${usersHook.userToDelete?.lastName}? This action CANNOT be undone.`}
        confirmText="Delete Permanently"
        isLoading={usersHook.deletingUserId === usersHook.userToDelete?.id}
        variant="danger"
      />

      {/* Edit User Modal */}
      <Modal
        isOpen={usersHook.showEditModal}
        onClose={usersHook.closeEditModal}
        title={`Edit ${usersHook.userToEdit?.role === 'CLIENT' ? 'Client' : 'Employee'}`}
        size="md"
      >
        <form onSubmit={usersHook.handleUpdateUser} className="space-y-4">
          {usersHook.editError && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-800 px-4 py-3 rounded-lg text-sm font-medium shadow-sm">
              {usersHook.editError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-navy-900 mb-2">
                First Name
              </label>
              <input
                type="text"
                required
                value={usersHook.editFormData.firstName || ''}
                onChange={(e) =>
                  usersHook.setEditFormData({ ...usersHook.editFormData, firstName: e.target.value })
                }
                className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 transition-all text-navy-900 placeholder:text-stone-400"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-navy-900 mb-2">
                Last Name
              </label>
              <input
                type="text"
                required
                value={usersHook.editFormData.lastName || ''}
                onChange={(e) =>
                  usersHook.setEditFormData({ ...usersHook.editFormData, lastName: e.target.value })
                }
                className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 transition-all text-navy-900 placeholder:text-stone-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-navy-900 mb2">Phone</label>
            <PhoneInput
              value={usersHook.editFormData.phone || ''}
              onChange={(phone) => usersHook.setEditFormData({ ...usersHook.editFormData, phone })}
              placeholder="Phone number"
            />
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={usersHook.closeEditModal}
              disabled={usersHook.updatingUserId !== null}
              className="px-5 py-2.5 text-sm font-medium text-stone-800 bg-stone-200 rounded-lg hover:bg-stone-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={usersHook.updatingUserId !== null}
              className="px-5 py-2.5 text-sm font-semibold text-navy-900 bg-gradient-to-r from-gold-500 to-gold-600 rounded-lg hover:from-gold-400 hover:to-gold-500 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none min-w-[120px] flex items-center justify-center shadow-lg hover:shadow-gold-300/50"
            >
              {usersHook.updatingUserId !== null ? <ButtonLoader /> : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
