'use client';

import { useState, useMemo } from 'react';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/modals/ConfirmModal';
import Pagination from '@/components/ui/Pagination';
import { ButtonLoader, PageLoader, TableRowSkeleton } from '@/components/ui/Loader';
import PhoneInput from '@/components/ui/inputs/PhoneInput';
import EmailInput from '@/components/ui/inputs/EmailInput';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { formatDate } from '@/lib/utils/date.utils';
import { useUsers } from '@/hooks/useUsers';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';
import { Role } from '@/types';
import { cn, INPUT_BASE, INPUT_VARIANTS } from '@/lib/styles';

type TabType = 'clients' | 'employees';

export default function UsersManagementPage() {
  const { isAuthenticated, isAdmin, loading } = useProtectedRoute({ requireAdmin: true });
  const usersHook = useUsers(isAuthenticated, isAdmin || false);
  const [activeTab, setActiveTab] = useState<TabType>('clients');
  const [userRole, setUserRole] = useState<Role.CLIENT | Role.EMPLOYEE>(Role.CLIENT);

  // Memoize filtered users to avoid recalculating on every render
  // IMPORTANT: useMemo must be called before any early returns
  const filteredUsers = useMemo(
    () => usersHook.users.filter((usr) =>
      activeTab === 'clients' ? usr.role === Role.CLIENT : usr.role === Role.EMPLOYEE
    ),
    [usersHook.users, activeTab]
  );

  // Memoize user counts for tab labels to avoid filtering twice
  const clientCount = useMemo(
    () => usersHook.users.filter(u => u.role === Role.CLIENT).length,
    [usersHook.users]
  );

  const employeeCount = useMemo(
    () => usersHook.users.filter(u => u.role === Role.EMPLOYEE).length,
    [usersHook.users]
  );

  // Early return AFTER all hooks have been called
  if (loading || (usersHook.isLoading && usersHook.users.length === 0)) {
    return <PageLoader text="Loading users..." />;
  }

  const handleOpenCreateModal = (role: Role.CLIENT | Role.EMPLOYEE) => {
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
        </DashboardHeader>

        {/* Content */}
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {usersHook.error && (
            <div className="mb-6 rounded-lg bg-red-50 border-l-4 border-red-500 p-4 shadow-md animate-slideDown">
              <p className="text-sm font-medium text-red-800">{usersHook.error}</p>
            </div>
          )}

          {/* Tabs & Actions */}
          <div className="mb-6">
            <div className="flex flex-wrap items-center justify-between border-b border-stone-300">
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

              <div className="py-2">
                {/* Desktop Button */}
                <button
                  onClick={() => handleOpenCreateModal(activeTab === 'clients' ? Role.CLIENT : Role.EMPLOYEE)}
                  className="hidden md:flex rounded-lg bg-gradient-to-r from-gold-500 to-gold-600 px-5 py-2.5 text-sm font-semibold text-navy-900 hover:from-gold-400 hover:to-gold-500 transition-all transform hover:scale-105 shadow-lg hover:shadow-gold-300/50"
                >
                  + New {activeTab === 'clients' ? 'Client' : 'Employee'}
                </button>

                {/* Mobile Icon Button */}
                <button
                  onClick={() => handleOpenCreateModal(activeTab === 'clients' ? Role.CLIENT : Role.EMPLOYEE)}
                  className="md:hidden flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-gold-500 to-gold-600 text-navy-900 hover:from-gold-400 hover:to-gold-500 shadow-lg transition-transform hover:scale-105"
                  aria-label={`New ${activeTab === 'clients' ? 'Client' : 'Employee'}`}
                >
                  {activeTab === 'clients' ? (
                    /* User Icon for Clients (Simpler) */
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                    </svg>
                  ) : (
                    /* Briefcase/Badge Icon for Employees */
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Zm6-10.125a1.875 1.875 0 1 1-3.75 0 1.875 1.875 0 0 1 3.75 0Zm1.294 6.336a6.721 6.721 0 0 1-3.17.789 6.721 6.721 0 0 1-3.168-.789 3.376 3.376 0 0 1 6.338 0Z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Desktop Users Table */}
          <div className="hidden md:block bg-white rounded-2xl shadow-2xl overflow-hidden border border-stone-200 animate-slideUp">
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
                  {usersHook.isLoading && usersHook.users.length === 0 ? (
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

          {/* Mobile Users Cards */}
          <div className="md:hidden space-y-4 animate-slideUp">
            {usersHook.isLoading && usersHook.users.length === 0 ? (
              <>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-2xl shadow-xl border border-stone-200 p-4 animate-pulse">
                    <div className="h-4 bg-stone-200 rounded w-3/4 mb-3"></div>
                    <div className="h-3 bg-stone-200 rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-stone-200 rounded w-2/3"></div>
                  </div>
                ))}
              </>
            ) : filteredUsers.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-xl border border-stone-200 p-6 text-center text-stone-500">
                No {activeTab} found.
              </div>
            ) : (
              filteredUsers.map((usr) => (
                <div key={usr.id} className="bg-white rounded-2xl shadow-xl border border-stone-200 p-4 hover:shadow-2xl transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="font-semibold text-navy-900 text-base">
                        {usr.firstName} {usr.lastName}
                      </div>
                      <div className="text-xs text-stone-500 mt-1">
                        Created {formatDate(usr.createdAt)}
                      </div>
                    </div>
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
                  </div>

                  <div className="space-y-2 text-sm mb-3">
                    <div className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-stone-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="text-stone-700 break-all">{usr.email}</span>
                    </div>
                    {usr.phone && (
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-stone-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <span className="text-stone-700">{usr.phone}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-stone-200">
                    <button
                      onClick={() => usersHook.openEditModal(usr)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-navy-600 hover:text-navy-900 hover:bg-navy-50 rounded-lg transition-colors border border-navy-200"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                      </svg>
                      <span className="text-sm font-medium">Edit</span>
                    </button>
                    <button
                      onClick={() => usersHook.openDeleteConfirm(usr)}
                      disabled={usersHook.deletingUserId === usr.id}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors border border-red-200 disabled:opacity-50"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                      </svg>
                      <span className="text-sm font-medium">Delete</span>
                    </button>
                  </div>
                </div>
              ))
            )}

            {/* Mobile Pagination */}
            {usersHook.totalPages > 0 && (
              <div className="bg-white rounded-2xl shadow-xl border border-stone-200 p-4">
                <Pagination
                  currentPage={usersHook.currentPage}
                  totalPages={usersHook.totalPages}
                  totalItems={usersHook.totalItems}
                  itemsPerPage={usersHook.itemsPerPage}
                  onPageChange={usersHook.setCurrentPage}
                  onItemsPerPageChange={usersHook.setItemsPerPage}
                />
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Create User Modal */}
      <Modal
        isOpen={usersHook.showCreateForm}
        onClose={() => {
          usersHook.setShowCreateForm(false);
          usersHook.setFormData({ email: '', firstName: '', lastName: '', phone: '', role: Role.CLIENT });
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
                className={cn(INPUT_BASE, INPUT_VARIANTS.default, 'text-navy-900')}
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
                className={cn(INPUT_BASE, INPUT_VARIANTS.default, 'text-navy-900')}
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
                usersHook.setFormData({ email: '', firstName: '', lastName: '', phone: '', role: Role.CLIENT });
              }}
              disabled={usersHook.isCreating}
              className="px-5 py-2.5 text-sm font-medium text-stone-800 bg-stone-200 rounded-lg hover:bg-stone-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={usersHook.isCreating}
              className="px-5 py-2.5 text-sm font-semibold text-navy-900 bg-gradient-to-r from-gold-500 to-gold-600 rounded-lg hover:from-gold-400 hover:to-gold-500 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none min-w-[120px] flex items-center justify-center shadow-lg hover:shadow-gold-300/50"
            >
              {usersHook.isCreating ? <ButtonLoader /> : `Create ${userRole === 'CLIENT' ? 'Client' : 'Employee'}`}
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
        onConfirm={() => usersHook.handleDeleteUser(false)}
        title="Delete User Permanently"
        message={`Are you sure you want to PERMANENTLY delete ${usersHook.userToDelete?.firstName} ${usersHook.userToDelete?.lastName}? This action CANNOT be undone.`}
        confirmText="Delete Permanently"
        isLoading={usersHook.deletingUserId === usersHook.userToDelete?.id}
        variant="danger"
      />

      {/* Force Delete Confirm Modal (Double Check) */}
      <ConfirmModal
        isOpen={usersHook.showForceDeleteConfirm}
        onClose={() => {
          usersHook.closeDeleteConfirm(); // Closes both
        }}
        onConfirm={() => usersHook.handleDeleteUser(true)}
        title="Cannot Delete User (Has Records)"
        message={`This user has associated records (e.g., Invoices, Projects). Do you want to FORCE delete EVERYTHING associated with them? This includes ALL invoices, projects, and payments. This action is IRREVERSIBLE.`}
        confirmText="Yes, Force Delete Everything"
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
                className={cn(INPUT_BASE, INPUT_VARIANTS.default, 'text-navy-900')}
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
                className={cn(INPUT_BASE, INPUT_VARIANTS.default, 'text-navy-900')}
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
