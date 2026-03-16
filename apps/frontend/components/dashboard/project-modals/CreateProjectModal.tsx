'use client';

import { memo } from 'react';
import dynamic from 'next/dynamic';
import { ButtonLoader } from '@/components/ui/Loader';
import { PROJECT_THEMES, type ProjectTheme } from '@/lib/styles';

const Modal = dynamic(() => import('@/components/ui/Modal'), { ssr: false });
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
        <div>
          <label htmlFor="create-name" className={`block text-sm font-medium ${styles.label} mb-2`}>
            Project Name *
          </label>
          <input
            id="create-name"
            type="text"
            required
            value={formData.name}
            onChange={(e) => onFormChange({ ...formData, name: e.target.value })}
            className={`w-full px-4 py-2.5 border border-stone-300 rounded-lg focus:ring-2 ${styles.focusRing} transition-all ${styles.input}`}
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
            value={formData.description}
            onChange={(e) => onFormChange({ ...formData, description: e.target.value })}
            className={`w-full px-4 py-2.5 border border-stone-300 rounded-lg focus:ring-2 ${styles.focusRing} transition-all resize-none ${styles.input}`}
            placeholder="Describe the project..."
          />
        </div>

        <div>
          <SearchableSelect
            id="create-client"
            label="Client"
            required
            value={formData.clientId}
            onChange={(value) => onFormChange({ ...formData, clientId: value })}
            options={clients.map((client) => ({
              id: client.id,
              name: `${client.firstName} ${client.lastName}`,
              description: client.email,
            }))}
            placeholder="Search for a client..."
          />
        </div>

        <div>
          <EmployeeSelect
            employees={employees}
            selectedIds={formData.employeeIds || []}
            onChange={(employeeIds) => onFormChange({ ...formData, employeeIds })}
            disabled={isSubmitting}
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
            <label htmlFor="create-payment-deadline" className={`block text-sm font-medium ${styles.label} mb-2`}>
              Initial Payment Deadline
            </label>
            <input
              id="create-payment-deadline"
              type="date"
              value={formData.initialPaymentDeadline || ''}
              onChange={(e) => onFormChange({ ...formData, initialPaymentDeadline: e.target.value })}
              className={`w-full px-4 py-2.5 border border-stone-300 rounded-lg focus:ring-2 ${styles.focusRing} transition-all ${styles.input}`}
            />
          </div>

          <div>
            <label htmlFor="create-deadline" className={`block text-sm font-medium ${styles.label} mb-2`}>
              Project Completion Deadline
            </label>
            <input
              id="create-deadline"
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
