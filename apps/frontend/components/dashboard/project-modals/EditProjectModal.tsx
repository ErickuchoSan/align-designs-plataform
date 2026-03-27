'use client';

import { memo, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Project } from '@/types';
import { ButtonLoader } from '@/components/ui/Loader';
import { BUTTON_BASE, BUTTON_VARIANTS, BUTTON_SIZES } from '@/lib/styles';
import ProjectFormFields from './ProjectFormFields';

const Modal = dynamic(() => import('@/components/ui/Modal'), { ssr: false });
const ConfirmModal = dynamic(() => import('@/components/modals/ConfirmModal'), { ssr: false });

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface ProjectFormData {
  name: string;
  description: string;
  clientId: string;
  employeeIds?: string[];
  initialAmountRequired?: number;
  deadlineDate?: string;
  initialPaymentDeadline?: string;
}

interface EditProjectModalProps {
  isConfirmOpen: boolean;
  isEditOpen: boolean;
  project: Project | null;
  formData: ProjectFormData;
  isSubmitting: boolean;
  canChangeClient: boolean;
  clients: Client[];
  employees: Client[];
  onConfirmClose: (show: boolean) => void;
  onEditClose: () => void;
  onProjectChange: (project: Project | null) => void;
  onFormChange: (data: ProjectFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onConfirm: () => void;
}

function EditProjectModal({
  isConfirmOpen,
  isEditOpen,
  project,
  formData,
  isSubmitting,
  canChangeClient,
  clients,
  employees,
  onConfirmClose,
  onEditClose,
  onProjectChange,
  onFormChange,
  onSubmit,
  onConfirm,
}: Readonly<EditProjectModalProps>) {
  const editModalEmployees = useMemo(() => {
    const currentEmployees = project?.employees?.map((e) => ({
      id: e.employee?.id || e.employeeId,
      firstName: e.employee?.firstName || '',
      lastName: e.employee?.lastName || '',
      email: e.employee?.email || '',
    })) || [];

    const employeeMap = new Map();
    employees.forEach(emp => employeeMap.set(emp.id, emp));
    currentEmployees.forEach(emp => employeeMap.set(emp.id, emp));

    return Array.from(employeeMap.values());
  }, [employees, project]);

  return (
    <>
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => {
          onConfirmClose(false);
          onProjectChange(null);
        }}
        onConfirm={onConfirm}
        title="Confirm Edit"
        message={`Are you sure you want to edit the project "${project?.name}"?`}
        confirmText="Edit"
        variant="warning"
      />

      <Modal isOpen={isEditOpen} onClose={onEditClose} title="Edit Project">
        <form onSubmit={onSubmit} className="space-y-5">
          <ProjectFormFields
            formData={formData}
            clients={clients}
            employees={editModalEmployees}
            isSubmitting={isSubmitting}
            idPrefix="edit"
            onFormChange={onFormChange}
            clientDisabled={!canChangeClient}
            clientWarning={canChangeClient ? undefined : 'Client cannot be changed: current client has uploaded files or comments'}
          />

          <div className="flex gap-3 justify-end pt-4 border-t border-[#D0C5B2]/20">
            <button
              type="button"
              onClick={onEditClose}
              disabled={isSubmitting}
              className={`${BUTTON_BASE} ${BUTTON_VARIANTS.secondary} ${BUTTON_SIZES.md}`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`${BUTTON_BASE} ${BUTTON_VARIANTS.primary} ${BUTTON_SIZES.md}`}
            >
              {isSubmitting ? <ButtonLoader /> : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export default memo(EditProjectModal);
