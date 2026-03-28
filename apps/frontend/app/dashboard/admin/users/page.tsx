'use client';

import { useMemo } from 'react';
import { PageLoader } from '@/components/ui/Loader';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { useUsers } from '@/hooks/useUsers';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';
import { Role } from '@/types';
import { UsersTable, UsersCards, UserModals } from './components';

export default function ClientsManagementPage() {
  const { isAuthenticated, isAdmin, loading } = useProtectedRoute({ requireAdmin: true });
  const usersHook = useUsers(isAuthenticated, isAdmin || false);

  const filteredUsers = useMemo(
    () => usersHook.users.filter((usr) => usr.role === Role.CLIENT),
    [usersHook.users]
  );

  const usersListProps = useMemo(() => ({
    users: filteredUsers,
    isLoading: usersHook.isLoading,
    activeTab: 'clients' as const,
    togglingUserId: usersHook.togglingUserId ?? null,
    deletingUserId: usersHook.deletingUserId ?? null,
    resendingUserId: usersHook.resendingUserId,
    currentPage: usersHook.currentPage,
    totalPages: usersHook.totalPages,
    totalItems: usersHook.totalItems,
    itemsPerPage: usersHook.itemsPerPage,
    onToggleStatus: usersHook.openToggleConfirm,
    onEdit: usersHook.openEditModal,
    onDelete: usersHook.openDeleteConfirm,
    onResendEmail: usersHook.handleResendWelcomeEmail,
    onPageChange: usersHook.setCurrentPage,
    onItemsPerPageChange: usersHook.setItemsPerPage,
  }), [
    filteredUsers,
    usersHook.isLoading,
    usersHook.togglingUserId,
    usersHook.deletingUserId,
    usersHook.resendingUserId,
    usersHook.currentPage,
    usersHook.totalPages,
    usersHook.totalItems,
    usersHook.itemsPerPage,
    usersHook.openToggleConfirm,
    usersHook.openEditModal,
    usersHook.openDeleteConfirm,
    usersHook.handleResendWelcomeEmail,
    usersHook.setCurrentPage,
    usersHook.setItemsPerPage,
  ]);

  if (loading || (usersHook.isLoading && usersHook.users.length === 0)) {
    return <PageLoader text="Loading clients..." />;
  }

  const handleOpenCreateModal = () => {
    usersHook.setFormData({ ...usersHook.formData, role: Role.CLIENT });
    usersHook.setShowCreateForm(true);
  };

  const handleCloseCreateModal = () => {
    usersHook.setShowCreateForm(false);
    usersHook.setFormData({ email: '', firstName: '', lastName: '', phone: '', role: Role.CLIENT });
  };

  return (
    <>
      <div className="flex flex-col h-full">
        <DashboardHeader title="Clients" showBackButton backUrl="/dashboard" />

        <main id="main-content" className="flex-1 px-6 py-8">
          <div className="max-w-7xl mx-auto">
            {usersHook.error && (
              <div className="mb-6 rounded-lg bg-red-50 border-l-4 border-red-500 p-4 shadow-md" role="alert">
                <p className="text-sm font-medium text-red-800">{usersHook.error}</p>
              </div>
            )}

            <div className="mb-6 flex items-center justify-between border-b border-[#D0C5B2]/20 pb-4">
              <p className="text-sm text-[#6B6A65]">
                {filteredUsers.length} client{filteredUsers.length !== 1 ? 's' : ''}
              </p>
              <button
                onClick={handleOpenCreateModal}
                className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-br from-[#755B00] to-[#C9A84C] text-white text-sm font-semibold hover:brightness-95 transition-all"
              >
                + New Client
              </button>
              <button
                onClick={handleOpenCreateModal}
                className="md:hidden flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-[#755B00] to-[#C9A84C] text-white hover:brightness-95 transition-all"
                aria-label="New Client"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>

            <UsersTable {...usersListProps} />
            <UsersCards {...usersListProps} />
          </div>
        </main>
      </div>

      <UserModals
        showCreateForm={usersHook.showCreateForm}
        onCloseCreate={handleCloseCreateModal}
        onCreateSubmit={usersHook.handleCreateClient}
        formData={usersHook.formData}
        onFormDataChange={usersHook.setFormData}
        isCreating={usersHook.isCreating}
        createError={usersHook.error}
        userRole={Role.CLIENT}
        showEditModal={usersHook.showEditModal}
        onCloseEdit={usersHook.closeEditModal}
        onEditSubmit={usersHook.handleUpdateUser}
        editFormData={usersHook.editFormData}
        onEditFormDataChange={usersHook.setEditFormData}
        isUpdating={usersHook.updatingUserId !== null}
        editError={usersHook.editError}
        userToEdit={usersHook.userToEdit}
        showToggleConfirm={usersHook.showToggleConfirm}
        onCloseToggle={usersHook.closeToggleConfirm}
        onToggleConfirm={usersHook.handleToggleStatus}
        userToToggle={usersHook.userToToggle}
        isToggling={usersHook.togglingUserId === usersHook.userToToggle?.id}
        showDeleteConfirm={usersHook.showDeleteConfirm}
        onCloseDelete={usersHook.closeDeleteConfirm}
        onDeleteConfirm={() => usersHook.handleDeleteUser(false)}
        userToDelete={usersHook.userToDelete}
        isDeleting={usersHook.deletingUserId === usersHook.userToDelete?.id}
        showForceDeleteConfirm={usersHook.showForceDeleteConfirm}
        onForceDeleteConfirm={() => usersHook.handleDeleteUser(true)}
      />
    </>
  );
}
