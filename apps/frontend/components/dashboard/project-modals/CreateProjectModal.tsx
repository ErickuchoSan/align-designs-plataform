'use client';

import { memo } from 'react';
import dynamic from 'next/dynamic';
import { ButtonLoader } from '@/components/ui/Loader';
import { PROJECT_THEMES, type ProjectTheme } from '@/lib/styles';
import ProjectFormFields from './ProjectFormFields';

const Modal = dynamic(() => import('@/components/ui/Modal'), { ssr: false });

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

interface CreateProjectModalProps {
  isOpen: boolean;
  formData: ProjectFormData;
  isSubmitting: boolean;
  clients: Client[];
  employees: Client[];
  onClose: () => void;
  onFormChange: (data: ProjectFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  theme?: ProjectTheme;
}

function CreateProjectModal({
  isOpen,
  formData,
  isSubmitting,
  clients,
  employees,
  onClose,
  onFormChange,
  onSubmit,
  theme = 'navy',
}: Readonly<CreateProjectModalProps>) {
  const styles = PROJECT_THEMES[theme];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Project">
      <form onSubmit={onSubmit} className="space-y-5">
        <ProjectFormFields
          formData={formData}
          clients={clients}
          employees={employees}
          isSubmitting={isSubmitting}
          styles={styles}
          idPrefix="create"
          onFormChange={onFormChange}
        />

        <div className="flex gap-3 justify-end pt-4 border-t border-stone-200">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className={`px-5 py-2.5 text-sm font-medium ${styles.cancelButton} rounded-lg transition-colors disabled:opacity-50`}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-5 py-2.5 text-sm font-medium text-white ${styles.primaryButton} rounded-lg hover:shadow-lg transition-all disabled:opacity-50 min-w-[120px] flex items-center justify-center`}
          >
            {isSubmitting ? <ButtonLoader /> : 'Create Project'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default memo(CreateProjectModal);
