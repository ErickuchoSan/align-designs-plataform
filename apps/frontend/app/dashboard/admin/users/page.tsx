'use client';

import { useState, useMemo } from 'react';
import { PageLoader } from '@/components/ui/Loader';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { useUsers } from '@/hooks/useUsers';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';
import { Role } from '@/types';
import { UsersTable, UsersCards, UserModals, UsersTabs } from './components';

type TabType = 'clients' | 'employees';

export default function UsersManagementPage() {
  const { isAuthenticated, isAdmin, loading } = useProtectedRoute({ requireAdmin: true });
  const usersHook = useUsers(isAuthenticated, isAdmin || false);
  const [activeTab, setActiveTab] = useState<TabType>('clients');
  const [userRole, setUserRole] = useState<Role.CLIENT | Role.EMPLOYEE>(Role.CLIENT);

  const filteredUsers = useMemo(
    () => usersHook.users.filter((usr) =>
      activeTab === 'clients' ? usr.role === Role.CLIENT : usr.role === Role.EMPLOYEE
    ),
    [usersHook.users, activeTab]
  );

  const clientCount = useMemo(
    () => usersHook.users.filter(u => u.role === Role.CLIENT).length,
    [usersHook.users]
  );

  const employeeCount = useMemo(
    () => usersHook.users.filter(u => u.role === Role.EMPLOYEE).length,
    [usersHook.users]
  );

  if (loading || (usersHook.isLoading && usersHook.users.length === 0)) {
    return <PageLoader text="Loading users..." />;
  }

  const handleOpenCreateModal = () => {
    const role = activeTab === 'clients' ? Role.CLIENT : Role.EMPLOYEE;
    setUserRole(role);
    usersHook.setFormData({ ...usersHook.formData, role });
    usersHook.setShowCreateForm(true);
  };

  const handleCloseCreateModal = () => {
    usersHook.setShowCreateForm(false);
    usersHook.setFormData({ email: '', firstName: '', lastName: '', phone: '', role: Role.CLIENT });
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-stone-50 via-stone-100 to-stone-200">
        <DashboardHeader title="User Management" showBackButton backUrl="/dashboard" />

        <main id="main-content" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {usersHook.error && (
            <div className="mb-6 rounded-lg bg-red-50 border-l-4 border-red-500 p-4 shadow-md animate-slideDown" role="alert">
              <p className="text-sm font-medium text-red-800">{usersHook.error}</p>
            </div>
          )}

          <UsersTabs
            activeTab={activeTab}
            clientCount={clientCount}
            employeeCount={employeeCount}
            onTabChange={setActiveTab}
            onCreateUser={handleOpenCreateModal}
          />

          <UsersTable
            users={filteredUsers}
            isLoading={usersHook.isLoading}
            activeTab={activeTab}
            togglingUserId={usersHook.togglingUserId}
            deletingUserId={usersHook.deletingUserId}
            currentPage={usersHook.currentPage}
            totalPages={usersHook.totalPages}
            totalItems={usersHook.totalItems}
            itemsPerPage={usersHook.itemsPerPage}
            onToggleStatus={usersHook.openToggleConfirm}
            onEdit={usersHook.openEditModal}
            onDelete={usersHook.openDeleteConfirm}
            onPageChange={usersHook.setCurrentPage}
            onItemsPerPageChange={usersHook.setItemsPerPage}
          />

          <UsersCards
            users={filteredUsers}
            isLoading={usersHook.isLoading}
            activeTab={activeTab}
            togglingUserId={usersHook.togglingUserId}
            deletingUserId={usersHook.deletingUserId}
            currentPage={usersHook.currentPage}
            totalPages={usersHook.totalPages}
            totalItems={usersHook.totalItems}
            itemsPerPage={usersHook.itemsPerPage}
            onToggleStatus={usersHook.openToggleConfirm}
            onEdit={usersHook.openEditModal}
            onDelete={usersHook.openDeleteConfirm}
            onPageChange={usersHook.setCurrentPage}
            onItemsPerPageChange={usersHook.setItemsPerPage}
          />
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
        userRole={userRole}
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
