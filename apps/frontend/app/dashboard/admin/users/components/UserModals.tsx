'use client';

import { memo } from 'react';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/modals/ConfirmModal';
import { ButtonLoader } from '@/components/ui/Loader';
import PhoneInput from '@/components/ui/inputs/PhoneInput';
import EmailInput from '@/components/ui/inputs/EmailInput';
import { Role, User, CreateUserDto } from '@/types';
import { INPUT_BASE, FORM_LABEL } from '@/lib/styles';

interface UserModalsProps {
  showCreateForm: boolean;
  onCloseCreate: () => void;
  onCreateSubmit: (e: React.FormEvent) => void;
  formData: CreateUserDto;
  onFormDataChange: (data: CreateUserDto) => void;
  isCreating: boolean;
  createError: string;
  userRole: Role.CLIENT | Role.EMPLOYEE;

  showEditModal: boolean;
  onCloseEdit: () => void;
  onEditSubmit: (e: React.FormEvent) => void;
  editFormData: { firstName?: string; lastName?: string; phone?: string };
  onEditFormDataChange: (data: { firstName?: string; lastName?: string; phone?: string }) => void;
  isUpdating: boolean;
  editError: string;
  userToEdit: User | null;

  showToggleConfirm: boolean;
  onCloseToggle: () => void;
  onToggleConfirm: () => void;
  userToToggle: User | null;
  isToggling: boolean;

  showDeleteConfirm: boolean;
  onCloseDelete: () => void;
  onDeleteConfirm: () => void;
  userToDelete: User | null;
  isDeleting: boolean;

  showForceDeleteConfirm: boolean;
  onForceDeleteConfirm: () => void;
}

function UserModals({
  showCreateForm, onCloseCreate, onCreateSubmit, formData, onFormDataChange, isCreating, createError, userRole,
  showEditModal, onCloseEdit, onEditSubmit, editFormData, onEditFormDataChange, isUpdating, editError, userToEdit,
  showToggleConfirm, onCloseToggle, onToggleConfirm, userToToggle, isToggling,
  showDeleteConfirm, onCloseDelete, onDeleteConfirm, userToDelete, isDeleting,
  showForceDeleteConfirm, onForceDeleteConfirm,
}: Readonly<UserModalsProps>) {
  const userTypeLabel = userRole === 'CLIENT' ? 'Client' : 'Employee';

  return (
    <>
      {/* Create User Modal */}
      <Modal isOpen={showCreateForm} onClose={onCloseCreate} title={`Create New ${userTypeLabel}`} size="md">
        <form onSubmit={onCreateSubmit} className="space-y-5">
          {createError && (
            <div className="bg-[#FFDAD6]/50 px-4 py-3 rounded-lg text-sm text-[#BA1A1A]" role="alert">
              {createError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label htmlFor="create-firstName" className={FORM_LABEL}>First Name</label>
              <input id="create-firstName" type="text" required value={formData.firstName}
                onChange={(e) => onFormDataChange({ ...formData, firstName: e.target.value })}
                className={INPUT_BASE} />
            </div>
            <div>
              <label htmlFor="create-lastName" className={FORM_LABEL}>Last Name</label>
              <input id="create-lastName" type="text" required value={formData.lastName}
                onChange={(e) => onFormDataChange({ ...formData, lastName: e.target.value })}
                className={INPUT_BASE} />
            </div>
          </div>

          <div>
            <label htmlFor="create-email" className={FORM_LABEL}>Email</label>
            <EmailInput id="create-email" value={formData.email}
              onChange={(email) => onFormDataChange({ ...formData, email })}
              placeholder="Email address" required />
          </div>

          <div>
            <label htmlFor="create-phone" className={FORM_LABEL}>Phone</label>
            <PhoneInput id="create-phone" value={formData.phone || ''}
              onChange={(phone) => onFormDataChange({ ...formData, phone })}
              placeholder="Phone number" />
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-[#D0C5B2]/20">
            <button type="button" onClick={onCloseCreate} disabled={isCreating}
              className="px-5 py-2.5 text-sm font-medium bg-[#E3E2DF] text-[#1B1C1A] rounded-lg hover:bg-[#D9D8D5] transition-colors disabled:opacity-50">
              Cancel
            </button>
            <button type="submit" disabled={isCreating}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-br from-[#755B00] to-[#C9A84C] rounded-lg hover:brightness-95 transition-all disabled:opacity-50 min-w-[120px] flex items-center justify-center">
              {isCreating ? <ButtonLoader /> : `Create ${userTypeLabel}`}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal isOpen={showEditModal} onClose={onCloseEdit} title={`Edit ${userToEdit?.role === 'CLIENT' ? 'Client' : 'Employee'}`} size="md">
        <form onSubmit={onEditSubmit} className="space-y-5">
          {editError && (
            <div className="bg-[#FFDAD6]/50 px-4 py-3 rounded-lg text-sm text-[#BA1A1A]" role="alert">
              {editError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label htmlFor="edit-firstName" className={FORM_LABEL}>First Name</label>
              <input id="edit-firstName" type="text" required value={editFormData.firstName || ''}
                onChange={(e) => onEditFormDataChange({ ...editFormData, firstName: e.target.value })}
                className={INPUT_BASE} />
            </div>
            <div>
              <label htmlFor="edit-lastName" className={FORM_LABEL}>Last Name</label>
              <input id="edit-lastName" type="text" required value={editFormData.lastName || ''}
                onChange={(e) => onEditFormDataChange({ ...editFormData, lastName: e.target.value })}
                className={INPUT_BASE} />
            </div>
          </div>

          <div>
            <label htmlFor="edit-phone" className={FORM_LABEL}>Phone</label>
            <PhoneInput id="edit-phone" value={editFormData.phone || ''}
              onChange={(phone) => onEditFormDataChange({ ...editFormData, phone })}
              placeholder="Phone number" />
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-[#D0C5B2]/20">
            <button type="button" onClick={onCloseEdit} disabled={isUpdating}
              className="px-5 py-2.5 text-sm font-medium bg-[#E3E2DF] text-[#1B1C1A] rounded-lg hover:bg-[#D9D8D5] transition-colors disabled:opacity-50">
              Cancel
            </button>
            <button type="submit" disabled={isUpdating}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-br from-[#755B00] to-[#C9A84C] rounded-lg hover:brightness-95 transition-all disabled:opacity-50 min-w-[120px] flex items-center justify-center">
              {isUpdating ? <ButtonLoader /> : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

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
