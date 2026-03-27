'use client';

import { memo } from 'react';
import dynamic from 'next/dynamic';
import { ButtonLoader } from '@/components/ui/Loader';
import { BUTTON_BASE, BUTTON_VARIANTS, BUTTON_SIZES } from '@/lib/styles';
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
}: Readonly<CreateProjectModalProps>) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Project">
      <form onSubmit={onSubmit} className="space-y-5">
        <ProjectFormFields
          formData={formData}
          clients={clients}
          employees={employees}
          isSubmitting={isSubmitting}
          idPrefix="create"
          onFormChange={onFormChange}
        />

        <div className="flex gap-3 justify-end pt-4 border-t border-[#D0C5B2]/20">
          <button
            type="button"
            onClick={onClose}
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
            {isSubmitting ? <ButtonLoader /> : 'Create Project'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default memo(CreateProjectModal);
