import { memo } from 'react';
import { Project } from '@/types';
import { type ProjectTheme } from '@/lib/styles';
import { CreateProjectModal, EditProjectModal, DeleteProjectModal } from './project-modals';

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

interface CreateModalState {
  isOpen: boolean;
  formData: ProjectFormData;
  isSubmitting: boolean;
  clients: Client[];
  employees: Client[];
  onClose: () => void;
  onFormChange: (data: ProjectFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
}

interface EditModalState {
  isConfirmOpen: boolean;
  isEditOpen: boolean;
  project: Project | null;
  formData: ProjectFormData;
  isSubmitting: boolean;
  canChangeClient: boolean;
  onConfirmClose: (show: boolean) => void;
  onEditClose: () => void;
  onProjectChange: (project: Project | null) => void;
  onFormChange: (data: ProjectFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onConfirm: () => void;
}

interface DeleteModalState {
  isOpen: boolean;
  project: Project | null;
  isDeleting: boolean;
  onClose: (show: boolean) => void;
  onProjectChange: (project: Project | null) => void;
  onConfirm: () => void;
}

interface ProjectModalsProps {
  createModal: CreateModalState;
  editModal: EditModalState;
  deleteModal: DeleteModalState;
  theme?: ProjectTheme;
}

function ProjectModals({
  createModal,
  editModal,
  deleteModal,
  theme = 'navy',
}: Readonly<ProjectModalsProps>) {
  return (
    <>
      <CreateProjectModal
        isOpen={createModal.isOpen}
        formData={createModal.formData}
        isSubmitting={createModal.isSubmitting}
        clients={createModal.clients}
        employees={createModal.employees}
        onClose={createModal.onClose}
        onFormChange={createModal.onFormChange}
        onSubmit={createModal.onSubmit}
        theme={theme}
      />

      <EditProjectModal
        isConfirmOpen={editModal.isConfirmOpen}
        isEditOpen={editModal.isEditOpen}
        project={editModal.project}
        formData={editModal.formData}
        isSubmitting={editModal.isSubmitting}
        canChangeClient={editModal.canChangeClient}
        clients={createModal.clients}
        employees={createModal.employees}
        onConfirmClose={editModal.onConfirmClose}
        onEditClose={editModal.onEditClose}
        onProjectChange={editModal.onProjectChange}
        onFormChange={editModal.onFormChange}
        onSubmit={editModal.onSubmit}
        onConfirm={editModal.onConfirm}
        theme={theme}
      />

      <DeleteProjectModal
        isOpen={deleteModal.isOpen}
        project={deleteModal.project}
        isDeleting={deleteModal.isDeleting}
        onClose={deleteModal.onClose}
        onProjectChange={deleteModal.onProjectChange}
        onConfirm={deleteModal.onConfirm}
      />
    </>
  );
}

export default memo(ProjectModals);
