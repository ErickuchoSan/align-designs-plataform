'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import Modal from '@/components/ui/Modal';
import LoadingButton from '@/components/ui/LoadingButton';
import { EmployeePaymentsService } from '@/services/employee-payments.service';
import { UsersService } from '@/services/users.service';
import { User } from '@/types';
import { handleApiError } from '@/lib/errors';
import { toast } from '@/lib/toast';
import { useFetchOnOpen, useFetch } from '@/hooks';
import { getTodayDateString } from '@/lib/utils/date-formatter';
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
}: PayEmployeeModalProps) {
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
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

  // DRY: Fetch employees when modal opens
  const { data: employees, loading: loadingEmployees } = useFetchOnOpen<User[]>(
    isOpen,
    () => UsersService.getEmployees(),
    { initialData: [], errorPrefix: 'Failed to load employees' }
  );

  // DRY: Fetch pending items when employee is selected
  const { data: pendingItems, loading: loadingItems } = useFetch<any[]>(
    () => EmployeePaymentsService.getPendingItems(projectId, employeeId),
    {
      immediate: false,
      enabled: !!employeeId && !!projectId,
      deps: [employeeId, projectId],
      initialData: [],
      errorPrefix: 'Failed to load pending items'
    }
  );

  const toggleItemSelection = (itemId: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  const onSubmit = async (data: PayEmployeeFormValues) => {
    try {
      const payload = {
        employeeId: data.employeeId,
        amount: Number(data.amount),
        paymentMethod: data.paymentMethod,
        paymentDate: new Date(data.paymentDate).toISOString(),
        description: data.description || undefined,
        projectItemIds: selectedItemIds.length > 0 ? selectedItemIds : undefined,
      };

      await EmployeePaymentsService.create(projectId, payload);
      toast.success('Payment recorded successfully');
      await onSuccess();
      handleClose();
    } catch (err) {
      toast.error(handleApiError(err, 'Failed to record payment'));
    }
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
          <label className={FORM_LABEL}>Select Employee</label>
          <select
            {...register('employeeId', { required: 'Please select an employee' })}
            disabled={loadingEmployees}
            className={cn(errors.employeeId ? inputErrorClass : inputClass, 'disabled:bg-stone-100')}
          >
            <option value="">-- Select Employee --</option>
            {(employees ?? []).map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.firstName} {emp.lastName} ({emp.email})
              </option>
            ))}
          </select>
          {errors.employeeId && <p className={FORM_ERROR}>{errors.employeeId.message}</p>}
          {loadingEmployees && <p className="text-xs text-stone-500 mt-1">Loading employees...</p>}
        </div>

        {employeeId && (
          <div className="border border-stone-200 rounded-lg p-3 bg-stone-50">
            <label className={FORM_LABEL}>Client Approved Items (Unpaid)</label>
            {loadingItems ? (
              <p className="text-xs text-stone-500">Loading pending items...</p>
            ) : (pendingItems ?? []).length === 0 ? (
              <p className="text-xs text-stone-500 italic">No pending approved items found.</p>
            ) : (
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {(pendingItems ?? []).map((item) => (
                  <div key={item.id} className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      id={`item-${item.id}`}
                      checked={selectedItemIds.includes(item.id)}
                      onChange={() => toggleItemSelection(item.id)}
                      className={cn(CHECKBOX_BASE, 'mt-1')}
                    />
                    <label htmlFor={`item-${item.id}`} className="text-sm text-stone-700 cursor-pointer">
                      <span className="font-medium block">{item.originalName || item.filename}</span>
                      <span className="text-xs text-stone-500">
                        Apv: {new Date(item.approvedClientAt).toLocaleDateString()}
                      </span>
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div>
          <label className={FORM_LABEL}>Amount (USD)</label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-stone-500">$</span>
            <input
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
            <label className={FORM_LABEL}>Payment Method</label>
            <input
              type="text"
              {...register('paymentMethod')}
              disabled
              className={cn(inputClass, 'cursor-not-allowed bg-stone-100 text-stone-500')}
            />
          </div>
          <div>
            <label className={FORM_LABEL}>Payment Date</label>
            <input
              type="date"
              {...register('paymentDate', { required: 'Date is required' })}
              className={errors.paymentDate ? inputErrorClass : inputClass}
            />
            {errors.paymentDate && <p className={FORM_ERROR}>{errors.paymentDate.message}</p>}
          </div>
        </div>

        <div>
          <label className={FORM_LABEL}>Description / Notes (Optional)</label>
          <textarea
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
            className="flex-1 px-4 py-2 font-medium text-stone-700 transition-colors bg-stone-100 rounded-lg hover:bg-stone-200"
          >
            Cancel
          </button>
          <LoadingButton
            type="submit"
            isLoading={isSubmitting}
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
