'use client';

import { memo, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Project } from '@/types';
import { ButtonLoader } from '@/components/ui/Loader';
import { PROJECT_THEMES, type ProjectTheme } from '@/lib/styles';

const Modal = dynamic(() => import('@/components/ui/Modal'), { ssr: false });
const ConfirmModal = dynamic(() => import('@/components/modals/ConfirmModal'), { ssr: false });
const EmployeeSelect = dynamic(() => import('@/components/projects/EmployeeSelect').then(mod => ({ default: mod.EmployeeSelect })), { ssr: false });
const SearchableSelect = dynamic(() => import('@/components/ui/inputs/SearchableSelect'), { ssr: false });

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
          <div>
            <label htmlFor="edit-name" className={`block text-sm font-medium ${styles.label} mb-2`}>
              Project Name *
            </label>
            <input
              id="edit-name"
              type="text"
              required
              value={formData.name}
              onChange={(e) => onFormChange({ ...formData, name: e.target.value })}
              className={`w-full px-4 py-2.5 border border-stone-300 rounded-lg focus:ring-2 ${styles.focusRing} transition-all ${styles.input}`}
              placeholder="e.g., Logo Design"
            />
          </div>

          <div>
            <label htmlFor="edit-description" className={`block text-sm font-medium ${styles.label} mb-2`}>
              Description
            </label>
            <textarea
              id="edit-description"
              rows={4}
              value={formData.description}
              onChange={(e) => onFormChange({ ...formData, description: e.target.value })}
              className={`w-full px-4 py-2.5 border border-stone-300 rounded-lg focus:ring-2 ${styles.focusRing} transition-all resize-none ${styles.input}`}
              placeholder="Describe the project..."
            />
          </div>

          <div>
            <SearchableSelect
              id="edit-client"
              label="Client"
              required
              value={formData.clientId}
              onChange={(value) => onFormChange({ ...formData, clientId: value })}
              disabled={!canChangeClient}
              options={clients.map((client) => ({
                id: client.id,
                name: `${client.firstName} ${client.lastName}`,
                description: client.email,
              }))}
              placeholder="Search for a client..."
            />
            {!canChangeClient && (
              <p className="mt-2 text-sm text-amber-600 flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Client cannot be changed: current client has uploaded files or comments
              </p>
            )}
          </div>

          <div>
            <EmployeeSelect
              employees={editModalEmployees}
              selectedIds={formData.employeeIds || []}
              onChange={(employeeIds) => onFormChange({ ...formData, employeeIds })}
              disabled={isSubmitting}
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
              value={formData.initialAmountRequired || ''}
              onChange={(e) => onFormChange({
                ...formData,
                initialAmountRequired: e.target.value ? Number.parseFloat(e.target.value) : undefined,
              })}
              onWheel={(e) => (e.target as HTMLInputElement).blur()}
              className={`w-full px-4 py-2.5 border border-stone-300 rounded-lg focus:ring-2 ${styles.focusRing} transition-all ${styles.input} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
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
                value={formData.initialPaymentDeadline || ''}
                onChange={(e) => onFormChange({ ...formData, initialPaymentDeadline: e.target.value })}
                className={`w-full px-4 py-2.5 border border-stone-300 rounded-lg focus:ring-2 ${styles.focusRing} transition-all ${styles.input}`}
              />
            </div>

            <div>
              <label htmlFor="edit-deadline" className={`block text-sm font-medium ${styles.label} mb-2`}>
                Project Completion Deadline
              </label>
              <input
                id="edit-deadline"
                type="date"
                value={formData.deadlineDate || ''}
                onChange={(e) => onFormChange({ ...formData, deadlineDate: e.target.value })}
                className={`w-full px-4 py-2.5 border border-stone-300 rounded-lg focus:ring-2 ${styles.focusRing} transition-all ${styles.input}`}
              />
            </div>
          </div>

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
