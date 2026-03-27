'use client';

import { memo } from 'react';
import dynamic from 'next/dynamic';
import { INPUT_BASE, FORM_LABEL } from '@/lib/styles';

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

interface ProjectFormFieldsProps {
  formData: ProjectFormData;
  clients: Client[];
  employees: Client[];
  isSubmitting: boolean;
  idPrefix: string;
  onFormChange: (data: ProjectFormData) => void;
  clientDisabled?: boolean;
  clientWarning?: string;
}


function ProjectFormFields({
  formData,
  clients,
  employees,
  isSubmitting,
  idPrefix,
  onFormChange,
  clientDisabled = false,
  clientWarning,
}: Readonly<ProjectFormFieldsProps>) {
  return (
    <>
      <div>
        <label htmlFor={`${idPrefix}-name`} className={FORM_LABEL}>Project Name *</label>
        <input
          id={`${idPrefix}-name`}
          type="text"
          required
          value={formData.name}
          onChange={(e) => onFormChange({ ...formData, name: e.target.value })}
          className={INPUT_BASE}
          placeholder="e.g., Logo Design"
        />
      </div>

      <div>
        <label htmlFor={`${idPrefix}-description`} className={FORM_LABEL}>Description</label>
        <textarea
          id={`${idPrefix}-description`}
          rows={3}
          value={formData.description}
          onChange={(e) => onFormChange({ ...formData, description: e.target.value })}
          className={`${INPUT_BASE} resize-none`}
          placeholder="Describe the project..."
        />
      </div>

      <div>
        <SearchableSelect
          id={`${idPrefix}-client`}
          label="Client"
          required
          value={formData.clientId}
          onChange={(value) => onFormChange({ ...formData, clientId: value })}
          disabled={clientDisabled}
          options={clients.map((client) => ({
            id: client.id,
            name: `${client.firstName} ${client.lastName}`,
            description: client.email,
          }))}
          placeholder="Search for a client..."
        />
        {clientWarning && (
          <p className="mt-2 text-xs text-amber-600 flex items-center gap-1.5">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {clientWarning}
          </p>
        )}
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
        <label htmlFor={`${idPrefix}-amount`} className={FORM_LABEL}>Initial Amount Required</label>
        <input
          id={`${idPrefix}-amount`}
          type="number"
          min="0"
          step="0.01"
          value={formData.initialAmountRequired || ''}
          onChange={(e) => onFormChange({
            ...formData,
            initialAmountRequired: e.target.value ? Number.parseFloat(e.target.value) : undefined,
          })}
          onWheel={(e) => (e.target as HTMLInputElement).blur()}
          className={`${INPUT_BASE} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
          placeholder="0.00"
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <label htmlFor={`${idPrefix}-payment-deadline`} className={FORM_LABEL}>Payment Deadline</label>
          <input
            id={`${idPrefix}-payment-deadline`}
            type="date"
            value={formData.initialPaymentDeadline || ''}
            onChange={(e) => onFormChange({ ...formData, initialPaymentDeadline: e.target.value })}
            className={INPUT_BASE}
          />
        </div>
        <div>
          <label htmlFor={`${idPrefix}-deadline`} className={FORM_LABEL}>Completion Deadline</label>
          <input
            id={`${idPrefix}-deadline`}
            type="date"
            value={formData.deadlineDate || ''}
            onChange={(e) => onFormChange({ ...formData, deadlineDate: e.target.value })}
            className={INPUT_BASE}
          />
        </div>
      </div>
    </>
  );
}

export default memo(ProjectFormFields);
