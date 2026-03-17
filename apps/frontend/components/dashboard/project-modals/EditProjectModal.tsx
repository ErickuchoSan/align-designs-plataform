'use client';

import { memo, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Project } from '@/types';
import { ButtonLoader } from '@/components/ui/Loader';
import { PROJECT_THEMES, type ProjectTheme } from '@/lib/styles';
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
  theme?: ProjectTheme;
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
  theme = 'navy',
}: Readonly<EditProjectModalProps>) {
  const styles = PROJECT_THEMES[theme];

  // Include both available employees AND currently assigned employees
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
      {/* Edit Confirmation Modal */}
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

      {/* Edit Project Modal */}
      <Modal isOpen={isEditOpen} onClose={onEditClose} title="Edit Project">
        <form onSubmit={onSubmit} className="space-y-5">
          <ProjectFormFields
            formData={formData}
            clients={clients}
            employees={editModalEmployees}
            isSubmitting={isSubmitting}
            styles={styles}
            idPrefix="edit"
            onFormChange={onFormChange}
            clientDisabled={!canChangeClient}
            clientWarning={canChangeClient ? undefined : 'Client cannot be changed: current client has uploaded files or comments'}
          />

          <div className="flex gap-3 justify-end pt-4 border-t border-stone-200">
            <button
              type="button"
              onClick={onEditClose}
              disabled={isSubmitting}
              className={`px-5 py-2.5 text-sm font-medium ${styles.cancelButton} rounded-lg transition-colors disabled:opacity-50`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-5 py-2.5 text-sm font-medium text-white ${styles.editButton} rounded-lg hover:shadow-lg transition-all disabled:opacity-50 min-w-[120px] flex items-center justify-center`}
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
