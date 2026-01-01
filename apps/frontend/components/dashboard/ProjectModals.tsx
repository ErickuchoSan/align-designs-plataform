import { useMemo, memo } from 'react';
import dynamic from 'next/dynamic';
import { Project } from '@/types';
import { ButtonLoader } from '@/app/components/Loader';

// Lazy load heavy components for better code splitting
const Modal = dynamic(() => import('@/app/components/Modal'), {
  loading: () => null,
  ssr: false,
});

const ConfirmModal = dynamic(() => import('@/app/components/ConfirmModal'), {
  loading: () => null,
  ssr: false,
});

const EmployeeSelect = dynamic(() => import('../projects/EmployeeSelect').then(mod => ({ default: mod.EmployeeSelect })), {
  loading: () => null,
  ssr: false,
});

const SearchableSelect = dynamic(() => import('@/app/components/SearchableSelect'), {
  loading: () => null,
  ssr: false,
});

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
  deadlineDate?: string; // Project completion deadline
  initialPaymentDeadline?: string; // Deadline for initial payment
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

function ProjectModals({
  createModal,
  editModal,
  deleteModal,
  theme = 'navy',
}: ProjectModalsProps) {
  const themeStyles = useMemo(() => ({
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
  }), [theme]);

  const styles = themeStyles[theme];

  // Fix: Ensure Edit Modal shows both AVAILABLE employees AND CURRENTLY ASSIGNED employees
  const editModalEmployees = useMemo(() => {
    const currentEmployees = editModal.project?.employees?.map((e: any) => ({
      id: e.employee.id,
      firstName: e.employee.firstName,
      lastName: e.employee.lastName,
      email: e.employee.email,
    })) || [];

    // Deduplicate by ID
    const employeeMap = new Map();

    // First add available employees
    createModal.employees.forEach(emp => employeeMap.set(emp.id, emp));

    // Then ensure current employees are included (overwriting if needed, though they shouldn't overlap usually)
    currentEmployees.forEach(emp => employeeMap.set(emp.id, emp));

    return Array.from(employeeMap.values());
  }, [createModal.employees, editModal.project]);

  return (
    <>
      {/* Create Project Modal */}
      <Modal
        isOpen={createModal.isOpen}
        onClose={createModal.onClose}
        title={theme === 'navy' ? 'Create New Project' : 'Create New Project'}
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
              placeholder={theme === 'navy' ? 'Describe the project...' : 'Describe the project...'}
            />
          </div>

          <div>
            <SearchableSelect
              id="create-client"
              label="Client"
              required
              value={createModal.formData.clientId}
              onChange={(value) => createModal.onFormChange({ ...createModal.formData, clientId: value })}
              options={createModal.clients.map((client) => ({
                id: client.id,
                name: `${client.firstName} ${client.lastName}`,
                description: client.email,
              }))}
              placeholder="Search for a client..."
            />
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="create-payment-deadline" className={`block text-sm font-medium ${styles.label} mb-2`}>
                Initial Payment Deadline
              </label>
              <input
                id="create-payment-deadline"
                type="date"
                value={createModal.formData.initialPaymentDeadline || ''}
                onChange={(e) => createModal.onFormChange({ ...createModal.formData, initialPaymentDeadline: e.target.value })}
                className={`w-full px-4 py-2.5 border border-stone-300 rounded-lg focus:ring-2 focus:ring-${theme === 'navy' ? 'gold' : 'blue'}-500 focus:border-transparent transition-all ${styles.input}`}
              />
            </div>

            <div>
              <label htmlFor="create-deadline" className={`block text-sm font-medium ${styles.label} mb-2`}>
                Project Completion Deadline
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
              {createModal.isSubmitting ? <ButtonLoader /> : (theme === 'navy' ? 'Create Project' : 'Create Project')}
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
        confirmText={theme === 'navy' ? 'Edit' : 'Edit'}
        variant="warning"
      />

      {/* Edit Project Modal */}
      <Modal
        isOpen={editModal.isEditOpen}
        onClose={editModal.onEditClose}
        title={theme === 'navy' ? 'Edit Project' : 'Edit Project'}
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
              placeholder={theme === 'navy' ? 'e.g., Logo Design' : 'e.g., Logo Design'}
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
              placeholder={theme === 'navy' ? 'Describe the project...' : 'Describe the project...'}
            />
          </div>

          <div>
            <SearchableSelect
              id="edit-client"
              label="Client"
              required
              value={editModal.formData.clientId}
              onChange={(value) => editModal.onFormChange({ ...editModal.formData, clientId: value })}
              disabled={!editModal.canChangeClient}
              options={createModal.clients.map((client) => ({
                id: client.id,
                name: `${client.firstName} ${client.lastName}`,
                description: client.email,
              }))}
              placeholder="Search for a client..."
            />
            {!editModal.canChangeClient && (
              <p className="mt-2 text-sm text-amber-600 flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Client cannot be changed: current client has uploaded files or comments
              </p>
            )}
          </div>

          <div>
            <EmployeeSelect
              employees={editModalEmployees}
              selectedIds={editModal.formData.employeeIds || []}
              onChange={(employeeIds) => editModal.onFormChange({ ...editModal.formData, employeeIds })}
              disabled={editModal.isSubmitting}
            />
          </div>

          <div>
            <label htmlFor="edit-amount" className={`block text-sm font-medium ${styles.label} mb-2`}>
              Initial Amount Required
            </label>
            <input
              id="edit-amount"
              type="number"
              min="0"
              step="0.01"
              value={editModal.formData.initialAmountRequired || ''}
              onChange={(e) => editModal.onFormChange({
                ...editModal.formData,
                initialAmountRequired: e.target.value ? parseFloat(e.target.value) : undefined
              })}
              className={`w-full px-4 py-2.5 border border-stone-300 rounded-lg focus:ring-2 focus:ring-${theme === 'navy' ? 'gold' : 'blue'}-500 focus:border-transparent transition-all ${styles.input}`}
              placeholder="0.00"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="edit-payment-deadline" className={`block text-sm font-medium ${styles.label} mb-2`}>
                Initial Payment Deadline
              </label>
              <input
                id="edit-payment-deadline"
                type="date"
                value={editModal.formData.initialPaymentDeadline || ''}
                onChange={(e) => editModal.onFormChange({ ...editModal.formData, initialPaymentDeadline: e.target.value })}
                className={`w-full px-4 py-2.5 border border-stone-300 rounded-lg focus:ring-2 focus:ring-${theme === 'navy' ? 'gold' : 'blue'}-500 focus:border-transparent transition-all ${styles.input}`}
              />
            </div>

            <div>
              <label htmlFor="edit-deadline" className={`block text-sm font-medium ${styles.label} mb-2`}>
                Project Completion Deadline
              </label>
              <input
                id="edit-deadline"
                type="date"
                value={editModal.formData.deadlineDate || ''}
                onChange={(e) => editModal.onFormChange({ ...editModal.formData, deadlineDate: e.target.value })}
                className={`w-full px-4 py-2.5 border border-stone-300 rounded-lg focus:ring-2 focus:ring-${theme === 'navy' ? 'gold' : 'blue'}-500 focus:border-transparent transition-all ${styles.input}`}
              />
            </div>
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

// Memoize component to prevent unnecessary re-renders of large modal components
// Only re-renders when modal states or theme change
export default memo(ProjectModals);
