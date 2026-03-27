'use client';

import { useForm } from 'react-hook-form';
import Modal from '@/components/ui/Modal';
import LoadingButton from '@/components/ui/LoadingButton';
import { useProjectForInvoiceQuery, useCreateInvoiceMutation } from '@/hooks/queries';
import { WarningIcon, SpinnerIcon } from '@/components/ui/icons';
import { cn, INPUT_BASE, INPUT_VARIANTS, FORM_LABEL, FORM_ERROR } from '@/lib/styles';

interface GenerateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onSuccess: () => void;
}

interface GenerateInvoiceFormValues {
  amount: string;
  dueDate: string;
  description: string;
}

export default function GenerateInvoiceModal({
  isOpen,
  onClose,
  projectId,
  onSuccess,
}: Readonly<GenerateInvoiceModalProps>) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<GenerateInvoiceFormValues>({
    defaultValues: {
      amount: '',
      dueDate: '',
      description: '',
    },
  });

  // TanStack Query: fetch project data with unpaid status
  const { data: projectData, isLoading: checkingUnpaid } = useProjectForInvoiceQuery(
    projectId,
    { enabled: isOpen }
  );

  // TanStack Query: create invoice mutation
  const createInvoiceMutation = useCreateInvoiceMutation();

  const hasUnpaid = projectData?.hasUnpaid ?? false;
  const clientId = projectData?.clientId ?? null;

  const onSubmit = async (data: GenerateInvoiceFormValues) => {
    if (!clientId) {
      return;
    }

    const issueDate = new Date();
    const due = new Date(data.dueDate);
    const diffTime = Math.abs(due.getTime() - issueDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    createInvoiceMutation.mutate(
      {
        projectId,
        clientId,
        issueDate: issueDate.toISOString(),
        dueDate: due.toISOString(),
        paymentTermsDays: Math.max(diffDays, 0),
        subtotal: Number(data.amount),
        totalAmount: Number(data.amount),
        notes: data.description || undefined,
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
    onClose();
  };

  const inputClass = cn(INPUT_BASE, INPUT_VARIANTS.default, 'py-2');
  const inputErrorClass = cn(INPUT_BASE, INPUT_VARIANTS.error, 'py-2');

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Generate Invoice" size="sm">
      {checkingUnpaid && (
        <div className="flex justify-center items-center py-8">
          <SpinnerIcon size="lg" className="text-[#1B1C1A]" />
        </div>
      )}
      {!checkingUnpaid && hasUnpaid && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-lg">
          <div className="flex items-start gap-3">
            <WarningIcon size="lg" className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-amber-900 mb-2">Cannot Generate New Invoice</h4>
              <p className="text-sm text-amber-800 mb-3">
                There are still unpaid invoices for this project. Please ensure all previous invoices
                are fully paid before generating a new one.
              </p>
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-colors text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {!checkingUnpaid && !hasUnpaid && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="invoice-amount" className={FORM_LABEL}>Total Amount (USD)</label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-[#6B6A65]">$</span>
              <input
                id="invoice-amount"
                type="number"
                step="0.01"
                {...register('amount', { required: 'Amount is required' })}
                className={cn(errors.amount ? inputErrorClass : inputClass, 'pl-7')}
                placeholder="0.00"
              />
            </div>
            {errors.amount && <p className={FORM_ERROR}>{errors.amount.message}</p>}
          </div>

          <div>
            <label htmlFor="invoice-dueDate" className={FORM_LABEL}>Due Date</label>
            <input
              id="invoice-dueDate"
              type="date"
              {...register('dueDate', { required: 'Due date is required' })}
              className={errors.dueDate ? inputErrorClass : inputClass}
            />
            {errors.dueDate && <p className={FORM_ERROR}>{errors.dueDate.message}</p>}
          </div>

          <div>
            <label htmlFor="invoice-description" className={FORM_LABEL}>Description / Concept</label>
            <textarea
              id="invoice-description"
              rows={3}
              {...register('description')}
              className={inputClass}
              placeholder="e.g. Web Development Phase 1..."
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
              isLoading={createInvoiceMutation.isPending}
              loadingText="Saving..."
              variant="primary"
              size="md"
              className="flex-1"
            >
              Generate Invoice
            </LoadingButton>
          </div>
        </form>
      )}
    </Modal>
  );
}