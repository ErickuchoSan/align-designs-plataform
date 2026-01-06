'use client';

import { useState, useEffect } from 'react';
import Modal from '@/app/components/Modal';
import { PaymentMethodSelect } from './PaymentMethodSelect';
import { ButtonLoader } from '@/app/components/Loader';
import { toast } from 'react-hot-toast';
import { PaymentsService } from '@/services/payments.service';
import { InvoicesService } from '@/services/invoices.service';
import { Invoice } from '@/types/invoice';
import { PaymentMethod, PaymentType } from '@/types/payments';
import { logger } from '@/lib/logger';

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
}: ClientPaymentUploadModalProps) {
  const [amount, setAmount] = useState<number | string>('');
  const [method, setMethod] = useState<PaymentMethod>(PaymentMethod.TRANSFER);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [invoiceId, setInvoiceId] = useState<string>('');

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAmount(suggestedAmount || '');
      fetchInvoices();
    } else {
      // Reset form
      setAmount('');
      setMethod(PaymentMethod.TRANSFER);
      setDate(new Date().toISOString().split('T')[0]);
      setNotes('');
      setFile(null);
      setInvoiceId('');
    }
  }, [isOpen, suggestedAmount, projectId]);

  const fetchInvoices = async () => {
    try {
      setLoadingInvoices(true);
      const data = await InvoicesService.getByProject(projectId);
      // Filter unpaid or partially paid invoices
      const unpaid = data.filter(inv => inv.status !== 'PAID' && inv.status !== 'CANCELLED');
      setInvoices(unpaid);
    } catch (error) {
      logger.error('Failed to fetch invoices for payment modal', error);
      // Silent error - user can proceed without invoice selection
    } finally {
      setLoadingInvoices(false);
    }
  };

  // Auto-fill amount when invoice is selected
  useEffect(() => {
    if (invoiceId) {
      const invoice = invoices.find(inv => inv.id === invoiceId);
      if (invoice) {
        const remaining = Number(invoice.totalAmount) - Number(invoice.amountPaid || 0);
        setAmount(remaining > 0 ? remaining : 0);
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

    try {
      setIsSubmitting(true);
      const formData = new FormData();

      // Append file first
      if (file) {
        formData.append('file', file);
      }

      // Then append all other fields
      formData.append('projectId', projectId);
      formData.append('amount', amount.toString());
      formData.append('paymentDate', new Date(date).toISOString());
      formData.append('paymentMethod', method);
      formData.append('type', invoiceId ? PaymentType.INVOICE : PaymentType.INITIAL_PAYMENT);
      if (invoiceId) formData.append('invoiceId', invoiceId);
      if (notes) formData.append('notes', notes);

      await PaymentsService.uploadClientPayment(formData);

      toast.success('Payment submitted for review');
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      logger.error('Failed to upload client payment', error, { projectId, amount });
      // Error already handled by global axios interceptor in dev mode
      // Only show user-friendly toast for production users
      toast.error('Failed to submit payment');
    } finally {
      setIsSubmitting(false);
    }
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
          <label className="block text-sm font-medium text-gray-700 mb-2">Amount Paid</label>
          <div className="relative rounded-md shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <span className="text-gray-500 sm:text-sm">$</span>
            </div>
            <input
              type="number"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="block w-full rounded-md border-gray-300 pl-7 pr-12 focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-3 border"
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Payment Method */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
          <PaymentMethodSelect value={method} onChange={setMethod} />
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Payment Date</label>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border"
          />
        </div>

        {/* Invoice Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Link to Invoice (Optional)</label>
          <select
            value={invoiceId}
            onChange={(e) => setInvoiceId(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border"
          >
            <option value="">-- General Payment --</option>
            {invoices.map(inv => (
              <option key={inv.id} value={inv.id}>
                {inv.invoiceNumber} - ${Number(inv.totalAmount).toLocaleString()}
              </option>
            ))}
          </select>
        </div>

        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Receipt File</label>
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
            className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
          />
          <p className="mt-1 text-xs text-gray-500">Supported: PDF, JPG, PNG (Max 5MB)</p>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border"
            placeholder="Additional details..."
          />
        </div>

        <div className="flex flex-col gap-2 pt-4 border-t border-gray-200 sm:flex-row sm:justify-end sm:gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:w-auto"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex justify-center w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:w-auto sm:min-w-[120px]"
          >
            {isSubmitting ? <ButtonLoader /> : 'Submit Payment'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
