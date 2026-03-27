'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import Modal from '@/components/ui/Modal';
import LoadingButton from '@/components/ui/LoadingButton';
import { useEmployeesQuery, usePendingItemsQuery, useCreateEmployeePaymentMutation } from '@/hooks/queries';
import { getTodayDateString, formatDate } from '@/lib/date.utils';
import { cn, INPUT_BASE, INPUT_VARIANTS, FORM_LABEL, FORM_ERROR, CHECKBOX_BASE } from '@/lib/styles';

interface PayEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onSuccess: () => void;
}

interface PayEmployeeFormValues {
  employeeId: string;
  amount: string;
  paymentDate: string;
  paymentMethod: string;
  description: string;
}

export default function PayEmployeeModal({
  isOpen,
  onClose,
  projectId,
  onSuccess,
}: Readonly<PayEmployeeModalProps>) {
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<PayEmployeeFormValues>({
    defaultValues: {
      employeeId: '',
      amount: '',
      paymentDate: getTodayDateString(),
      paymentMethod: 'TRANSFER',
      description: '',
    },
  });

  const employeeId = watch('employeeId');

  // TanStack Query: fetch employees when modal opens
  const { data: employees = [], isLoading: loadingEmployees } = useEmployeesQuery({
    enabled: isOpen,
  });

  // TanStack Query: fetch pending items when employee is selected
  const { data: pendingItems = [], isLoading: loadingItems } = usePendingItemsQuery(
    projectId,
    employeeId,
    { enabled: !!employeeId && !!projectId }
  );

  // TanStack Query: create payment mutation
  const createPaymentMutation = useCreateEmployeePaymentMutation(projectId);

  const toggleItemSelection = (itemId: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  const onSubmit = async (data: PayEmployeeFormValues) => {
    createPaymentMutation.mutate(
      {
        employeeId: data.employeeId,
        amount: Number(data.amount),
        paymentMethod: data.paymentMethod,
        paymentDate: new Date(data.paymentDate).toISOString(),
        description: data.description || undefined,
        projectItemIds: selectedItemIds.length > 0 ? selectedItemIds : undefined,
      },
      {
        onSuccess: () => {
          onSuccess();
          handleClose();
        },
      }
    );
  };

  const handleClose = () => {
    reset();
    setSelectedItemIds([]);
    onClose();
  };

  const inputClass = cn(INPUT_BASE, INPUT_VARIANTS.default, 'py-2');
  const inputErrorClass = cn(INPUT_BASE, INPUT_VARIANTS.error, 'py-2');

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Record Employee Payment" size="md">
      <form id="pay-employee-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="pay-employee-employeeId" className={FORM_LABEL}>Select Employee</label>
          <select
            id="pay-employee-employeeId"
            {...register('employeeId', { required: 'Please select an employee' })}
            disabled={loadingEmployees}
            className={cn(errors.employeeId ? inputErrorClass : inputClass, 'disabled:bg-[#F5F4F0]')}
          >
            <option value="">-- Select Employee --</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.firstName} {emp.lastName} ({emp.email})
              </option>
            ))}
          </select>
          {errors.employeeId && <p className={FORM_ERROR}>{errors.employeeId.message}</p>}
          {loadingEmployees && <p className="text-xs text-[#6B6A65] mt-1">Loading employees...</p>}
        </div>

        {employeeId && (
          <fieldset className="border border-[#D0C5B2]/20 rounded-lg p-3 bg-[#F5F4F0]">
            <legend className={FORM_LABEL}>Client Approved Items (Unpaid)</legend>
            {loadingItems && (
              <p className="text-xs text-[#6B6A65]">Loading pending items...</p>
            )}
            {!loadingItems && pendingItems.length === 0 && (
              <p className="text-xs text-[#6B6A65] italic">No pending approved items found.</p>
            )}
            {!loadingItems && pendingItems.length > 0 && (
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {pendingItems.map((item: any) => (
                  <div key={item.id} className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      id={`item-${item.id}`}
                      checked={selectedItemIds.includes(item.id)}
                      onChange={() => toggleItemSelection(item.id)}
                      className={cn(CHECKBOX_BASE, 'mt-1')}
                    />
                    <label htmlFor={`item-${item.id}`} className="text-sm text-[#1B1C1A] cursor-pointer">
                      <span className="font-medium block">{item.originalName || item.filename}</span>
                      <span className="text-xs text-[#6B6A65]">
                        Apv: {formatDate(item.approvedClientAt)}
                      </span>
                    </label>
                  </div>
                ))}
              </div>
            )}
          </fieldset>
        )}

        <div>
          <label htmlFor="pay-employee-amount" className={FORM_LABEL}>Amount (USD)</label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-[#6B6A65]">$</span>
            <input
              id="pay-employee-amount"
              type="number"
              step="0.01"
              {...register('amount', { required: 'Amount is required' })}
              className={cn(errors.amount ? inputErrorClass : inputClass, 'pl-7')}
              placeholder="0.00"
            />
          </div>
          {errors.amount && <p className={FORM_ERROR}>{errors.amount.message}</p>}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="pay-employee-method" className={FORM_LABEL}>Payment Method</label>
            <input
              id="pay-employee-method"
              type="text"
              {...register('paymentMethod')}
              disabled
              className={cn(inputClass, 'cursor-not-allowed bg-[#F5F4F0] text-[#6B6A65]')}
            />
          </div>
          <div>
            <label htmlFor="pay-employee-date" className={FORM_LABEL}>Payment Date</label>
            <input
              id="pay-employee-date"
              type="date"
              {...register('paymentDate', { required: 'Date is required' })}
              className={errors.paymentDate ? inputErrorClass : inputClass}
            />
            {errors.paymentDate && <p className={FORM_ERROR}>{errors.paymentDate.message}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="pay-employee-description" className={FORM_LABEL}>Description / Notes (Optional)</label>
          <textarea
            id="pay-employee-description"
            rows={2}
            {...register('description')}
            className={inputClass}
            placeholder="e.g. Salary advance, Phase 1 Completion..."
          />
        </div>

        <div className="flex flex-col gap-2 pt-4 sm:flex-row sm:gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 px-4 py-2 font-medium text-[#6B6A65] transition-colors bg-[#F5F4F0] rounded-lg hover:bg-[#F5F4F0]"
          >
            Cancel
          </button>
          <LoadingButton
            type="submit"
            isLoading={createPaymentMutation.isPending}
            loadingText="Saving..."
            disabled={!employeeId}
            variant="primary"
            size="md"
            className="flex-1"
          >
            Record Payment
          </LoadingButton>
        </div>
      </form>
    </Modal>
  );
}