'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { PaymentMethodSelect } from './PaymentMethodSelect';
import { ButtonLoader } from '@/components/ui/Loader';
import { toast } from '@/lib/toast';
import { PaymentsService } from '@/services/payments.service';
import { InvoicesService } from '@/services/invoices.service';
import { Invoice } from '@/types/invoice';
import { PaymentMethod, PaymentType } from '@/types/payments';
import { useFetchOnOpen, useAsyncOperation } from '@/hooks';
import { getTodayDateString } from '@/lib/utils/date-formatter';
import { cn, INPUT_BASE, INPUT_VARIANTS, TEXTAREA_BASE, BUTTON_BASE, BUTTON_VARIANTS, BUTTON_SIZES } from '@/lib/styles';

interface ClientPaymentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onSuccess?: () => void;
  suggestedAmount?: number;
  maxAmount?: number;
}

export default function ClientPaymentUploadModal({
  isOpen,
  onClose,
  projectId,
  onSuccess,
  suggestedAmount,
  maxAmount,
}: Readonly<ClientPaymentUploadModalProps>) {
  const [amount, setAmount] = useState<number | string>('');
  const [method, setMethod] = useState<PaymentMethod>(PaymentMethod.TRANSFER);
  const [date, setDate] = useState(getTodayDateString());
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [invoiceId, setInvoiceId] = useState<string>('');

  // DRY: Use useAsyncOperation for submit handling
  const { loading: isSubmitting, execute } = useAsyncOperation();

  // DRY: Use useFetchOnOpen for automatic fetch when modal opens
  const { data: invoices } = useFetchOnOpen<Invoice[]>(
    isOpen,
    async () => {
      const data = await InvoicesService.getByProject(projectId);
      return data.filter(inv => inv.status !== 'PAID' && inv.status !== 'CANCELLED');
    },
    { deps: [projectId], initialData: [], errorPrefix: 'Failed to fetch invoices' }
  );

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setAmount(suggestedAmount || '');
    } else {
      setAmount('');
      setMethod(PaymentMethod.TRANSFER);
      setDate(getTodayDateString());
      setNotes('');
      setFile(null);
      setInvoiceId('');
    }
  }, [isOpen, suggestedAmount]);

  // Auto-fill amount when invoice is selected
  useEffect(() => {
    if (invoiceId && invoices) {
      const invoice = invoices.find(inv => inv.id === invoiceId);
      if (invoice) {
        const remaining = Number(invoice.totalAmount) - Number(invoice.amountPaid || 0);
        setAmount(Math.max(remaining, 0));
      }
    }
  }, [invoiceId, invoices]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (maxAmount && Number(amount) > maxAmount) {
      toast.error(`Amount cannot exceed the remaining balance of $${maxAmount.toLocaleString()}`);
      return;
    }

    if (!file && method === PaymentMethod.TRANSFER) {
      toast.error('Please upload the payment receipt');
      return;
    }

    // DRY: Use execute() for automatic loading state and error handling
    await execute(
      async () => {
        const formData = new FormData();

        if (file) {
          formData.append('file', file);
        }

        formData.append('projectId', projectId);
        formData.append('amount', amount.toString());
        formData.append('paymentDate', new Date(date).toISOString());
        formData.append('paymentMethod', method);
        formData.append('type', invoiceId ? PaymentType.INVOICE : PaymentType.INITIAL_PAYMENT);
        if (invoiceId) formData.append('invoiceId', invoiceId);
        if (notes) formData.append('notes', notes);

        await PaymentsService.uploadClientPayment(formData);
      },
      {
        successMessage: 'Payment submitted for review',
        errorMessagePrefix: 'Failed to submit payment',
        onSuccess: () => {
          if (onSuccess) onSuccess();
          onClose();
        },
      }
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Upload Payment Proof">
      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Warning for Bank Transfers */}
        <div className="p-3 shadow-sm bg-amber-50 border-l-4 border-amber-500 rounded-r sm:p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-amber-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-xs font-bold tracking-wide text-amber-800 uppercase sm:text-sm">
                Important
              </h3>
              <div className="mt-1 text-xs font-bold text-amber-900 sm:mt-2 sm:text-sm">
                <p>
                  For bank transfers, you MUST upload the official receipt shared directly from your banking app. Screenshots of messages or transaction summaries are NOT accepted.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Amount */}
        <div>
          <label htmlFor="payment-amount" className="block mb-2 text-sm font-medium text-stone-700">Amount Paid</label>
          <div className="relative rounded-md shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <span className="text-stone-500 sm:text-sm">$</span>
            </div>
            <input
              id="payment-amount"
              type="number"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={cn(INPUT_BASE, INPUT_VARIANTS.default, 'pl-7 pr-12 py-3')}
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Payment Method */}
        <fieldset>
          <legend className="block mb-2 text-sm font-medium text-stone-700">Payment Method</legend>
          <PaymentMethodSelect value={method} onChange={setMethod} />
        </fieldset>

        {/* Date */}
        <div>
          <label htmlFor="payment-date" className="block mb-2 text-sm font-medium text-stone-700">Payment Date</label>
          <input
            id="payment-date"
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={cn(INPUT_BASE, INPUT_VARIANTS.default)}
          />
        </div>

        {/* Invoice Selection */}
        <div>
          <label htmlFor="payment-invoice" className="block mb-2 text-sm font-medium text-stone-700">Link to Invoice (Optional)</label>
          <select
            id="payment-invoice"
            value={invoiceId}
            onChange={(e) => setInvoiceId(e.target.value)}
            className={cn(INPUT_BASE, INPUT_VARIANTS.default)}
          >
            <option value="">-- General Payment --</option>
            {(invoices ?? []).map(inv => (
              <option key={inv.id} value={inv.id}>
                {inv.invoiceNumber} - ${Number(inv.totalAmount).toLocaleString()}
              </option>
            ))}
          </select>
        </div>

        {/* File Upload */}
        <div>
          <label htmlFor="payment-receipt" className="block mb-2 text-sm font-medium text-stone-700">Receipt File</label>
          <input
            id="payment-receipt"
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
            className="block w-full text-sm text-stone-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-stone-50 file:text-navy-700
                    hover:file:bg-stone-100"
          />
          <p className="mt-1 text-xs text-stone-500">Supported: PDF, JPG, PNG (Max 5MB)</p>
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="payment-notes" className="block mb-2 text-sm font-medium text-stone-700">Notes</label>
          <textarea
            id="payment-notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className={cn(TEXTAREA_BASE, INPUT_VARIANTS.default)}
            placeholder="Additional details..."
          />
        </div>

        <div className="flex flex-col gap-2 pt-4 border-t border-gray-200 sm:flex-row sm:justify-end sm:gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className={cn(BUTTON_BASE, BUTTON_VARIANTS.ghost, BUTTON_SIZES.md, 'w-full border border-stone-300 sm:w-auto')}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={cn(BUTTON_BASE, BUTTON_VARIANTS.primary, BUTTON_SIZES.md, 'w-full sm:w-auto')}
          >
            {isSubmitting ? <ButtonLoader /> : 'Submit Payment'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
