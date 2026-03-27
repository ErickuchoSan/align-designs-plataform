'use client';

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

export default function UsersPage() {
  const { isAuthenticated, isAdmin, loading } = useProtectedRoute({ requireAdmin: true });
  const usersHook = useUsers(isAuthenticated, isAdmin || false);

  if (loading || (usersHook.isLoading && usersHook.users.length === 0)) {
    return <PageLoader text="Loading users..." />;
  }

  return (
    <>
      <div className="flex flex-col h-full">
        <DashboardHeader
          title="User Management"
          showBackButton
          backUrl="/dashboard"
        >
          <button
            onClick={() => usersHook.setShowCreateForm(true)}
            className="bg-gradient-to-br from-[#755B00] to-[#C9A84C] text-white font-semibold px-5 py-2.5 rounded-lg hover:brightness-95 transition-all"
          >
            + New Client
          </button>
        </DashboardHeader>

        {/* Content */}
        <main className="flex-1 px-6 py-8">
          <div className="max-w-7xl mx-auto">


          {usersHook.error && (
            <div className="mb-6 rounded-lg bg-red-50 border-l-4 border-red-500 p-4 shadow-md animate-slideDown">
              <p className="text-sm font-medium text-red-800">{usersHook.error}</p>
            </div>
          )}

          {/* Desktop Users Table */}
          <div className="hidden md:block bg-white rounded-2xl overflow-hidden animate-slideUp">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#D0C5B2]/15">
                <thead className="bg-[#F5F4F0]">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-[#1B1C1A] uppercase tracking-wider">User</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-[#1B1C1A] uppercase tracking-wider">Email</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-[#1B1C1A] uppercase tracking-wider">Phone</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-[#1B1C1A] uppercase tracking-wider">Role</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-[#1B1C1A] uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-[#1B1C1A] uppercase tracking-wider">Created At</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-[#1B1C1A] uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-[#D0C5B2]/15">
                  {usersHook.isLoading && usersHook.users.length === 0 ? (
                    <>
                      {[1, 2, 3].map((i) => (
                        <TableRowSkeleton key={i} />
                      ))}
                    </>
                  ) : (
                    usersHook.users
                      .filter((usr) => usr.role === 'CLIENT')
                      .map((usr) => (
                        <tr key={usr.id} className="hover:bg-[#F5F4F0] transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-semibold text-[#1B1C1A]">
                              {usr.firstName} {usr.lastName}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-[#6B6A65]">
                            {usr.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-[#6B6A65]">
                            {usr.phone || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-3 py-1 inline-flex text-xs font-semibold rounded-full ${usr.role === 'ADMIN'
                                ? 'bg-[#F5F4F0] text-[#1B1C1A]'
                                : 'bg-[#C9A84C]/20 text-[#755B00]'
                                }`}
                            >
                              {usr.role === 'ADMIN' ? 'Admin' : 'Client'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {usr.role === 'CLIENT' ? (
                              <button
                                onClick={() => usersHook.openToggleConfirm(usr)}
                                disabled={usersHook.togglingUserId === usr.id}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#C9A84C] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${usr.isActive ? 'bg-emerald-600' : 'bg-[#E3E2DF]'
                                  }`}
                                aria-label={`${usr.isActive ? 'Deactivate' : 'Activate'} user ${usr.firstName} ${usr.lastName}`}
                              >
                                <span
                                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${usr.isActive ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                />
                              </button>
                            ) : (
                              <span className="px-3 py-1 inline-flex text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                                Active
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-[#6B6A65]">
                            {formatDate(usr.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {usr.role === 'CLIENT' && (
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
                            )}
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
            {usersHook.isLoading && usersHook.users.length === 0 && (
              <>
                {['skeleton-1', 'skeleton-2', 'skeleton-3'].map((key) => (
                  <div key={key} className="bg-white rounded-2xl shadow-xl border border-[#D0C5B2]/20 p-4 animate-pulse">
                    <div className="h-4 bg-[#F5F4F0] rounded w-3/4 mb-3"></div>
                    <div className="h-3 bg-[#F5F4F0] rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-[#F5F4F0] rounded w-2/3"></div>
                  </div>
                ))}
              </>
            )}
            {!usersHook.isLoading && !usersHook.users.some((usr) => usr.role === 'CLIENT') && (
              <div className="bg-white rounded-2xl shadow-xl border border-[#D0C5B2]/20 p-6 text-center text-[#6B6A65]">
                No clients found.
              </div>
            )}
            {usersHook.users.some((usr) => usr.role === 'CLIENT') &&
              usersHook.users
                .filter((usr) => usr.role === 'CLIENT')
                .map((usr) => (
                  <div key={usr.id} className="bg-white rounded-2xl shadow-xl border border-[#D0C5B2]/20 p-4 hover:shadow-2xl transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="font-semibold text-[#1B1C1A] text-base">
                          {usr.firstName} {usr.lastName}
                        </div>
                        <div className="text-xs text-[#6B6A65] mt-1">
                          Created {formatDate(usr.createdAt)}
                        </div>
                      </div>
                      <button
                        onClick={() => usersHook.openToggleConfirm(usr)}
                        disabled={usersHook.togglingUserId === usr.id}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#C9A84C] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${usr.isActive ? 'bg-emerald-600' : 'bg-[#E3E2DF]'
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
                        <svg className="w-4 h-4 text-[#6B6A65] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span className="text-[#6B6A65] break-all">{usr.email}</span>
                      </div>
                      {usr.phone && (
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-[#6B6A65] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          <span className="text-[#6B6A65]">{usr.phone}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-3 border-t border-[#D0C5B2]/20">
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
            }

            {/* Mobile Pagination */}
            {usersHook.totalPages > 0 && (
              <div className="bg-white rounded-2xl shadow-xl border border-[#D0C5B2]/20 p-4">
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
          </div>
        </main>
      </div>

      {/* Create Client Modal */}
      <Modal
        isOpen={usersHook.showCreateForm}
        onClose={() => {
          usersHook.setShowCreateForm(false);
          usersHook.setFormData({ email: '', firstName: '', lastName: '', phone: '', role: Role.CLIENT });
        }}
        title="Create New Client"
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
              <label htmlFor="user-firstName" className="block text-sm font-semibold text-[#1B1C1A] mb-2">
                First Name
              </label>
              <input
                id="user-firstName"
                type="text"
                required
                value={usersHook.formData.firstName}
                onChange={(e) =>
                  usersHook.setFormData({ ...usersHook.formData, firstName: e.target.value })
                }
                className={cn(INPUT_BASE, INPUT_VARIANTS.default, 'text-[#1B1C1A]')}
              />
            </div>
            <div>
              <label htmlFor="user-lastName" className="block text-sm font-semibold text-[#1B1C1A] mb-2">
                Last Name
              </label>
              <input
                id="user-lastName"
                type="text"
                required
                value={usersHook.formData.lastName}
                onChange={(e) =>
                  usersHook.setFormData({ ...usersHook.formData, lastName: e.target.value })
                }
                className={cn(INPUT_BASE, INPUT_VARIANTS.default, 'text-[#1B1C1A]')}
              />
            </div>
          </div>

          <div>
            <label htmlFor="user-email" className="block text-sm font-semibold text-[#1B1C1A] mb-2">Email</label>
            <EmailInput
              id="user-email"
              value={usersHook.formData.email}
              onChange={(email) => usersHook.setFormData({ ...usersHook.formData, email })}
              placeholder="Email address"
              required
            />
          </div>

          <div>
            <label htmlFor="user-phone" className="block text-sm font-semibold text-[#1B1C1A] mb-2">Phone</label>
            <PhoneInput
              id="user-phone"
              value={usersHook.formData.phone || ''}
              onChange={(phone) => usersHook.setFormData({ ...usersHook.formData, phone })}
              placeholder="Phone number"
            />
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={() => {
                usersHook.setShowCreateForm(false);
                usersHook.setFormData({ email: '', firstName: '', lastName: '', phone: '', role: Role.CLIENT });
              }}
              disabled={usersHook.isCreating}
              className="px-5 py-2.5 text-sm font-medium text-[#1B1C1A] bg-[#E3E2DF] rounded-lg hover:bg-[#D9D8D5] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={usersHook.isCreating}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-br from-[#755B00] to-[#C9A84C] rounded-lg hover:brightness-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px] flex items-center justify-center"
            >
              {usersHook.isCreating ? <ButtonLoader /> : 'Create Client'}
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
    </>
  );
}
