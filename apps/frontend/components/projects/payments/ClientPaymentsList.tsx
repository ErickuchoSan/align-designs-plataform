'use client';

import { memo } from 'react';
import { Payment } from '@/types/payments';
import { CheckCircleIcon } from '@/components/ui/icons';
import { formatDate } from '@/lib/date.utils';
import PaymentEmptyState from './PaymentEmptyState';

const getPaymentStatusColor = (status: string): string => {
  switch (status) {
    case 'PENDING_APPROVAL':
      return 'bg-yellow-100 text-yellow-800';
    case 'CONFIRMED':
      return 'bg-green-100 text-green-800';
    case 'REJECTED':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

interface ClientPaymentsListProps {
  payments: Payment[];
  onViewReceipt: (payment: Payment) => void;
}

function ClientPaymentsList({ payments, onViewReceipt }: Readonly<ClientPaymentsListProps>) {
  if (payments.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-[#6B6A65]">No payments made yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {payments.map((payment) => (
        <div
          key={payment.id}
          className="flex items-center justify-between p-4 bg-[#F5F4F0] rounded-lg"
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <p className="font-medium text-[#1B1C1A]">
                {payment.type === 'INITIAL_PAYMENT' ? 'Initial Payment' : 'Invoice Payment'}
              </p>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(payment.status)}`}>
                {payment.status}
              </span>
            </div>
            <div className="text-sm text-[#6B6A65] space-y-1">
              <p className="font-semibold text-green-600">
                ${Number(payment.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
              <p>Method: {payment.paymentMethod}</p>
              <p>Date: {formatDate(payment.paymentDate)}</p>
              {payment.notes && <p>Note: {payment.notes}</p>}
              {payment.rejectionReason && (
                <p className="text-red-600">Rejection Reason: {payment.rejectionReason}</p>
              )}
            </div>
          </div>
          {payment.receiptFileUrl && (
            <button
              onClick={() => onViewReceipt(payment)}
              className="p-2 text-[#6B6A65] hover:text-[#C9A84C] hover:bg-[#F5F4F0] rounded-lg transition-colors"
              aria-label="View payment receipt"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

export default memo(ClientPaymentsList);

// Separate component for Admin view of pending payments
interface PendingPaymentsListProps {
  payments: Payment[];
  onReviewPayment: (payment: Payment) => void;
}

export const PendingPaymentsList = memo(function PendingPaymentsList({
  payments,
  onReviewPayment,
}: Readonly<PendingPaymentsListProps>) {
  const pendingPayments = payments.filter((p) => p.status === 'PENDING_APPROVAL');

  if (pendingPayments.length === 0) {
    return (
      <PaymentEmptyState
        icon={<CheckCircleIcon className="w-full h-full" />}
        message="No payments pending approval"
        hint="All client payments have been reviewed"
      />
    );
  }

  return (
    <div className="space-y-3">
      {pendingPayments.map((payment) => (
        <div
          key={payment.id}
          className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
        >
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <p className="font-medium text-[#1B1C1A]">
                {payment.type === 'INITIAL_PAYMENT' ? 'Initial Payment' : 'Invoice Payment'}
              </p>
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                PENDING APPROVAL
              </span>
            </div>
            <div className="text-sm text-[#6B6A65] space-y-1">
              <p className="font-semibold text-lg text-green-600">
                Amount: ${Number(payment.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
              <p>Method: {payment.paymentMethod}</p>
              <p>Date: {formatDate(payment.paymentDate)}</p>
              {payment.notes && <p>Note: {payment.notes}</p>}
              {payment.invoiceId && <p className="text-[#C9A84C]">Linked to Invoice</p>}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onReviewPayment(payment)}
              className="px-4 py-2 bg-gradient-to-br from-[#755B00] to-[#C9A84C] text-white rounded-lg text-sm font-medium hover:brightness-95 transition-colors flex items-center gap-2"
            >
              <CheckCircleIcon size="md" aria-hidden="true" />
              Review Payment
            </button>
          </div>
        </div>
      ))}
    </div>
  );
});
