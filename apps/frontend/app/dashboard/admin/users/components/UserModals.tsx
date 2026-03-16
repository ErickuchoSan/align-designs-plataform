'use client';

import { memo } from 'react';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/modals/ConfirmModal';
import { ButtonLoader } from '@/components/ui/Loader';
import PhoneInput from '@/components/ui/inputs/PhoneInput';
import EmailInput from '@/components/ui/inputs/EmailInput';
import { Role, User, CreateUserDto } from '@/types';
import { cn, INPUT_BASE, INPUT_VARIANTS } from '@/lib/styles';

interface UserModalsProps {
  // Create Modal
  showCreateForm: boolean;
  onCloseCreate: () => void;
  onCreateSubmit: (e: React.FormEvent) => void;
  formData: CreateUserDto;
  onFormDataChange: (data: CreateUserDto) => void;
  isCreating: boolean;
  createError: string;
  userRole: Role.CLIENT | Role.EMPLOYEE;

  // Edit Modal
  showEditModal: boolean;
  onCloseEdit: () => void;
  onEditSubmit: (e: React.FormEvent) => void;
  editFormData: { firstName?: string; lastName?: string; phone?: string };
  onEditFormDataChange: (data: { firstName?: string; lastName?: string; phone?: string }) => void;
  isUpdating: boolean;
  editError: string;
  userToEdit: User | null;

  // Toggle Confirm Modal
  showToggleConfirm: boolean;
  onCloseToggle: () => void;
  onToggleConfirm: () => void;
  userToToggle: User | null;
  isToggling: boolean;

  // Delete Confirm Modal
  showDeleteConfirm: boolean;
  onCloseDelete: () => void;
  onDeleteConfirm: () => void;
  userToDelete: User | null;
  isDeleting: boolean;

  // Force Delete Confirm Modal
  showForceDeleteConfirm: boolean;
  onForceDeleteConfirm: () => void;
}

function UserModals({
  showCreateForm,
  onCloseCreate,
  onCreateSubmit,
  formData,
  onFormDataChange,
  isCreating,
  createError,
  userRole,
  showEditModal,
  onCloseEdit,
  onEditSubmit,
  editFormData,
  onEditFormDataChange,
  isUpdating,
  editError,
  userToEdit,
  showToggleConfirm,
  onCloseToggle,
  onToggleConfirm,
  userToToggle,
  isToggling,
  showDeleteConfirm,
  onCloseDelete,
  onDeleteConfirm,
  userToDelete,
  isDeleting,
  showForceDeleteConfirm,
  onForceDeleteConfirm,
}: UserModalsProps) {
  return (
    <>
      {/* Create User Modal */}
      <Modal
        isOpen={showCreateForm}
        onClose={onCloseCreate}
        title={`Create New ${userRole === 'CLIENT' ? 'Client' : 'Employee'}`}
        size="md"
      >
        <form onSubmit={onCreateSubmit} className="space-y-4">
          {createError && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-800 px-4 py-3 rounded-lg text-sm font-medium shadow-sm" role="alert">
              {createError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="create-firstName" className="block text-sm font-semibold text-navy-900 mb-2">
                First Name
              </label>
              <input
                id="create-firstName"
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => onFormDataChange({ ...formData, firstName: e.target.value })}
                className={cn(INPUT_BASE, INPUT_VARIANTS.default, 'text-navy-900')}
              />
            </div>
            <div>
              <label htmlFor="create-lastName" className="block text-sm font-semibold text-navy-900 mb-2">
                Last Name
              </label>
              <input
                id="create-lastName"
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => onFormDataChange({ ...formData, lastName: e.target.value })}
                className={cn(INPUT_BASE, INPUT_VARIANTS.default, 'text-navy-900')}
              />
            </div>
          </div>

          <div>
            <label htmlFor="create-email" className="block text-sm font-semibold text-navy-900 mb-2">Email</label>
            <EmailInput
              id="create-email"
              value={formData.email}
              onChange={(email) => onFormDataChange({ ...formData, email })}
              placeholder="Email address"
              required
            />
          </div>

          <div>
            <label htmlFor="create-phone" className="block text-sm font-semibold text-navy-900 mb-2">Phone</label>
            <PhoneInput
              id="create-phone"
              value={formData.phone || ''}
              onChange={(phone) => onFormDataChange({ ...formData, phone })}
              placeholder="Phone number"
            />
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={onCloseCreate}
              disabled={isCreating}
              className="px-5 py-2.5 text-sm font-medium text-stone-800 bg-stone-200 rounded-lg hover:bg-stone-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="px-5 py-2.5 text-sm font-semibold text-navy-900 bg-gradient-to-r from-gold-500 to-gold-600 rounded-lg hover:from-gold-400 hover:to-gold-500 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none min-w-[120px] flex items-center justify-center shadow-lg hover:shadow-gold-300/50"
            >
              {isCreating ? <ButtonLoader /> : `Create ${userRole === 'CLIENT' ? 'Client' : 'Employee'}`}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={onCloseEdit}
        title={`Edit ${userToEdit?.role === 'CLIENT' ? 'Client' : 'Employee'}`}
        size="md"
      >
        <form onSubmit={onEditSubmit} className="space-y-4">
          {editError && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-800 px-4 py-3 rounded-lg text-sm font-medium shadow-sm" role="alert">
              {editError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="edit-firstName" className="block text-sm font-semibold text-navy-900 mb-2">
                First Name
              </label>
              <input
                id="edit-firstName"
                type="text"
                required
                value={editFormData.firstName || ''}
                onChange={(e) => onEditFormDataChange({ ...editFormData, firstName: e.target.value })}
                className={cn(INPUT_BASE, INPUT_VARIANTS.default, 'text-navy-900')}
              />
            </div>
            <div>
              <label htmlFor="edit-lastName" className="block text-sm font-semibold text-navy-900 mb-2">
                Last Name
              </label>
              <input
                id="edit-lastName"
                type="text"
                required
                value={editFormData.lastName || ''}
                onChange={(e) => onEditFormDataChange({ ...editFormData, lastName: e.target.value })}
                className={cn(INPUT_BASE, INPUT_VARIANTS.default, 'text-navy-900')}
              />
            </div>
          </div>

          <div>
            <label htmlFor="edit-phone" className="block text-sm font-semibold text-navy-900 mb-2">Phone</label>
            <PhoneInput
              id="edit-phone"
              value={editFormData.phone || ''}
              onChange={(phone) => onEditFormDataChange({ ...editFormData, phone })}
              placeholder="Phone number"
            />
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={onCloseEdit}
              disabled={isUpdating}
              className="px-5 py-2.5 text-sm font-medium text-stone-800 bg-stone-200 rounded-lg hover:bg-stone-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUpdating}
              className="px-5 py-2.5 text-sm font-semibold text-navy-900 bg-gradient-to-r from-gold-500 to-gold-600 rounded-lg hover:from-gold-400 hover:to-gold-500 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none min-w-[120px] flex items-center justify-center shadow-lg hover:shadow-gold-300/50"
            >
              {isUpdating ? <ButtonLoader /> : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Toggle Status Confirm Modal */}
      <ConfirmModal
        isOpen={showToggleConfirm}
        onClose={onCloseToggle}
        onConfirm={onToggleConfirm}
        title={`${userToToggle?.isActive ? 'Deactivate' : 'Activate'} User`}
        message={`Are you sure you want to ${userToToggle?.isActive ? 'deactivate' : 'activate'} ${userToToggle?.firstName} ${userToToggle?.lastName}?`}
        confirmText={userToToggle?.isActive ? 'Deactivate' : 'Activate'}
        isLoading={isToggling}
        variant={userToToggle?.isActive ? 'warning' : 'info'}
      />

      {/* Hard Delete Confirm Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={onCloseDelete}
        onConfirm={onDeleteConfirm}
        title="Delete User Permanently"
        message={`Are you sure you want to PERMANENTLY delete ${userToDelete?.firstName} ${userToDelete?.lastName}? This action CANNOT be undone.`}
        confirmText="Delete Permanently"
        isLoading={isDeleting}
        variant="danger"
      />

      {/* Force Delete Confirm Modal */}
      <ConfirmModal
        isOpen={showForceDeleteConfirm}
        onClose={onCloseDelete}
        onConfirm={onForceDeleteConfirm}
        title="Cannot Delete User (Has Records)"
        message="This user has associated records (e.g., Invoices, Projects). Do you want to FORCE delete EVERYTHING associated with them? This includes ALL invoices, projects, and payments. This action is IRREVERSIBLE."
        confirmText="Yes, Force Delete Everything"
        isLoading={isDeleting}
        variant="danger"
      />
    </>
  );
}

export default memo(UserModals);
