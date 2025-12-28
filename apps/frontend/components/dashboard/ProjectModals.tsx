import { Project } from '@/types';
import Modal from '@/app/components/Modal';
import ConfirmModal from '@/app/components/ConfirmModal';
import { ButtonLoader } from '@/app/components/Loader';
import { EmployeeSelect } from '../projects/EmployeeSelect';

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
  // Phase 1: Workflow fields
  employeeIds?: string[];
  initialAmountRequired?: number;
  deadlineDate?: string;
}

/**
 * State and actions for the Create Project modal
 */
interface CreateModalState {
  isOpen: boolean;
  formData: ProjectFormData;
  isSubmitting: boolean;
  clients: Client[];
  employees: Client[]; // Phase 1: Employee list
  onClose: () => void;
  onFormChange: (data: ProjectFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
}

/**
 * State and actions for the Edit Project modal
 */
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

/**
 * State and actions for the Delete Project modal
 */
interface DeleteModalState {
  isOpen: boolean;
  project: Project | null;
  isDeleting: boolean;
  onClose: (show: boolean) => void;
  onProjectChange: (project: Project | null) => void;
  onConfirm: () => void;
}

/**
 * Props for ProjectModals component
 * Grouped by modal type to reduce prop drilling
 */
interface ProjectModalsProps {
  createModal: CreateModalState;
  editModal: EditModalState;
  deleteModal: DeleteModalState;
  theme?: 'navy' | 'blue';
}

export default function ProjectModals({
  createModal,
  editModal,
  deleteModal,
  theme = 'navy',
}: ProjectModalsProps) {
  const themeStyles = {
    navy: {
      input: 'text-navy-900 placeholder:text-stone-700',
      label: 'text-navy-900',
      cancelButton: 'text-navy-900 bg-stone-200 hover:bg-stone-300',
      createButton: 'bg-navy-800 hover:bg-navy-700',
      editButton: 'bg-gold-600 hover:bg-gold-500',
    },
    blue: {
      input: 'text-gray-900 placeholder:text-gray-700',
      label: 'text-gray-700',
      cancelButton: 'text-gray-800 bg-gray-200 hover:bg-gray-300',
      createButton: 'bg-gradient-to-r from-blue-600 to-indigo-600',
      editButton: 'bg-gradient-to-r from-yellow-600 to-orange-600',
    },
  };

  const styles = themeStyles[theme];

  return (
    <>
      {/* Create Project Modal */}
      <Modal
        isOpen={createModal.isOpen}
        onClose={createModal.onClose}
        title={theme === 'navy' ? 'Crear Nuevo Proyecto' : 'Create New Project'}
      >
        <form onSubmit={createModal.onSubmit} className="space-y-5">
          <div>
            <label htmlFor="create-name" className={`block text-sm font-medium ${styles.label} mb-2`}>
              Project Name *
            </label>
            <input
              id="create-name"
              type="text"
              required
              value={createModal.formData.name}
              onChange={(e) => createModal.onFormChange({ ...createModal.formData, name: e.target.value })}
              className={`w-full px-4 py-2.5 border border-stone-300 rounded-lg focus:ring-2 focus:ring-${theme === 'navy' ? 'gold' : 'blue'}-500 focus:border-transparent transition-all ${styles.input}`}
              placeholder="e.g., Logo Design"
            />
          </div>

          <div>
            <label htmlFor="create-description" className={`block text-sm font-medium ${styles.label} mb-2`}>
              Description
            </label>
            <textarea
              id="create-description"
              rows={4}
              value={createModal.formData.description}
              onChange={(e) => createModal.onFormChange({ ...createModal.formData, description: e.target.value })}
              className={`w-full px-4 py-2.5 border border-stone-300 rounded-lg focus:ring-2 focus:ring-${theme === 'navy' ? 'gold' : 'blue'}-500 focus:border-transparent transition-all resize-none ${styles.input}`}
              placeholder={theme === 'navy' ? 'Describe el proyecto...' : 'Describe the project...'}
            />
          </div>

          <div>
            <label htmlFor="create-client" className={`block text-sm font-medium ${styles.label} mb-2`}>
              Client *
            </label>
            <select
              id="create-client"
              required
              value={createModal.formData.clientId}
              onChange={(e) => createModal.onFormChange({ ...createModal.formData, clientId: e.target.value })}
              className={`w-full px-4 py-2.5 border border-stone-300 rounded-lg focus:ring-2 focus:ring-${theme === 'navy' ? 'gold' : 'blue'}-500 focus:border-transparent transition-all ${styles.input}`}
            >
              <option value="">Select a client</option>
              {createModal.clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.firstName} {client.lastName} ({client.email})
                </option>
              ))}
            </select>
          </div>

          {/* Phase 1: Workflow fields */}
          <div>
            <EmployeeSelect
              employees={createModal.employees}
              selectedIds={createModal.formData.employeeIds || []}
              onChange={(employeeIds) => createModal.onFormChange({ ...createModal.formData, employeeIds })}
              disabled={createModal.isSubmitting}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="create-amount" className={`block text-sm font-medium ${styles.label} mb-2`}>
                Initial Amount Required
              </label>
              <input
                id="create-amount"
                type="number"
                min="0"
                step="0.01"
                value={createModal.formData.initialAmountRequired || ''}
                onChange={(e) => createModal.onFormChange({
                  ...createModal.formData,
                  initialAmountRequired: e.target.value ? parseFloat(e.target.value) : undefined
                })}
                className={`w-full px-4 py-2.5 border border-stone-300 rounded-lg focus:ring-2 focus:ring-${theme === 'navy' ? 'gold' : 'blue'}-500 focus:border-transparent transition-all ${styles.input}`}
                placeholder="0.00"
              />
            </div>

            <div>
              <label htmlFor="create-deadline" className={`block text-sm font-medium ${styles.label} mb-2`}>
                Deadline Date
              </label>
              <input
                id="create-deadline"
                type="date"
                value={createModal.formData.deadlineDate || ''}
                onChange={(e) => createModal.onFormChange({ ...createModal.formData, deadlineDate: e.target.value })}
                className={`w-full px-4 py-2.5 border border-stone-300 rounded-lg focus:ring-2 focus:ring-${theme === 'navy' ? 'gold' : 'blue'}-500 focus:border-transparent transition-all ${styles.input}`}
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-stone-200">
            <button
              type="button"
              onClick={createModal.onClose}
              disabled={createModal.isSubmitting}
              className={`px-5 py-2.5 text-sm font-medium ${styles.cancelButton} rounded-lg transition-colors disabled:opacity-50`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createModal.isSubmitting}
              className={`px-5 py-2.5 text-sm font-medium text-white ${styles.createButton} rounded-lg hover:shadow-lg transition-all disabled:opacity-50 min-w-[120px] flex items-center justify-center`}
            >
              {createModal.isSubmitting ? <ButtonLoader /> : (theme === 'navy' ? 'Crear Proyecto' : 'Create Project')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Confirmation Modal */}
      <ConfirmModal
        isOpen={editModal.isConfirmOpen}
        onClose={() => {
          editModal.onConfirmClose(false);
          editModal.onProjectChange(null);
        }}
        onConfirm={editModal.onConfirm}
        title="Confirm Edit"
        message={`Are you sure you want to edit the project "${editModal.project?.name}"?`}
        confirmText={theme === 'navy' ? 'Editar' : 'Edit'}
        variant="warning"
      />

      {/* Edit Project Modal */}
      <Modal
        isOpen={editModal.isEditOpen}
        onClose={editModal.onEditClose}
        title={theme === 'navy' ? 'Editar Proyecto' : 'Edit Project'}
      >
        <form onSubmit={editModal.onSubmit} className="space-y-5">
          <div>
            <label htmlFor="edit-name" className={`block text-sm font-medium ${styles.label} mb-2`}>
              Project Name *
            </label>
            <input
              id="edit-name"
              type="text"
              required
              value={editModal.formData.name}
              onChange={(e) => editModal.onFormChange({ ...editModal.formData, name: e.target.value })}
              className={`w-full px-4 py-2.5 border border-stone-300 rounded-lg focus:ring-2 focus:ring-${theme === 'navy' ? 'gold' : 'blue'}-500 focus:border-transparent transition-all ${styles.input}`}
              placeholder={theme === 'navy' ? 'Ej: Diseño de Logo' : 'e.g., Logo Design'}
            />
          </div>

          <div>
            <label htmlFor="edit-description" className={`block text-sm font-medium ${styles.label} mb-2`}>
              Description
            </label>
            <textarea
              id="edit-description"
              rows={4}
              value={editModal.formData.description}
              onChange={(e) => editModal.onFormChange({ ...editModal.formData, description: e.target.value })}
              className={`w-full px-4 py-2.5 border border-stone-300 rounded-lg focus:ring-2 focus:ring-${theme === 'navy' ? 'gold' : 'blue'}-500 focus:border-transparent transition-all resize-none ${styles.input}`}
              placeholder={theme === 'navy' ? 'Describe el proyecto...' : 'Describe the project...'}
            />
          </div>

          <div>
            <label htmlFor="edit-client" className={`block text-sm font-medium ${styles.label} mb-2`}>
              Client *
            </label>
            <select
              id="edit-client"
              required
              value={editModal.formData.clientId}
              onChange={(e) => editModal.onFormChange({ ...editModal.formData, clientId: e.target.value })}
              disabled={!editModal.canChangeClient}
              className={`w-full px-4 py-2.5 border border-stone-300 rounded-lg focus:ring-2 focus:ring-${theme === 'navy' ? 'gold' : 'blue'}-500 focus:border-transparent transition-all ${styles.input} ${!editModal.canChangeClient ? 'opacity-50 cursor-not-allowed bg-stone-100' : ''}`}
              title={!editModal.canChangeClient ? 'Cannot change client: current client has uploaded files or comments to this project' : ''}
            >
              <option value="">Select a client</option>
              {createModal.clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.firstName} {client.lastName} ({client.email})
                </option>
              ))}
            </select>
            {!editModal.canChangeClient && (
              <p className="mt-2 text-sm text-amber-600 flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Client cannot be changed: current client has uploaded files or comments
              </p>
            )}
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-stone-200">
            <button
              type="button"
              onClick={editModal.onEditClose}
              disabled={editModal.isSubmitting}
              className={`px-5 py-2.5 text-sm font-medium ${styles.cancelButton} rounded-lg transition-colors disabled:opacity-50`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={editModal.isSubmitting}
              className={`px-5 py-2.5 text-sm font-medium text-white ${styles.editButton} rounded-lg hover:shadow-lg transition-all disabled:opacity-50 min-w-[120px] flex items-center justify-center`}
            >
              {editModal.isSubmitting ? <ButtonLoader /> : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => {
          deleteModal.onClose(false);
          deleteModal.onProjectChange(null);
        }}
        onConfirm={deleteModal.onConfirm}
        title="Delete Project"
        message={`Are you sure you want to delete the project "${deleteModal.project?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        isLoading={deleteModal.isDeleting}
        variant="danger"
      />
    </>
  );
}
