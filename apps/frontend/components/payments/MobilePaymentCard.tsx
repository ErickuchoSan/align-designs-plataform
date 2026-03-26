'use client';

import { memo, useMemo } from 'react';
import { Payment, PAYMENT_METHOD_LABELS, PAYMENT_TYPE_LABELS, PAYMENT_STATUS_LABELS } from '@/types/payments';
import { formatDate } from '@/lib/date.utils';

const formatCurrency = (amount: number | string) => {
  return Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2 });
};

interface MobilePaymentCardProps {
  payment: Payment;
  isAdmin?: boolean;
  onViewReceipt?: (payment: Payment) => void;
  onOpenReceipt?: (paymentId: string) => void;
}

function MobilePaymentCard({ payment, isAdmin, onViewReceipt, onOpenReceipt }: Readonly<MobilePaymentCardProps>) {
  const formattedAmount = useMemo(() => formatCurrency(payment.amount), [payment.amount]);
  const formattedDate = useMemo(() => formatDate(payment.paymentDate, 'invoice'), [payment.paymentDate]);

  const statusStyles: Record<string, string> = {
    CONFIRMED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
    PENDING_APPROVAL: 'bg-yellow-100 text-yellow-800',
    PENDING_CONFIRMATION: 'bg-blue-100 text-blue-800',
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="text-sm font-medium text-gray-900">{formattedDate}</div>
          <div className="text-xs text-gray-500 mt-1">{PAYMENT_TYPE_LABELS[payment.type]}</div>
        </div>
        <span
          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
            statusStyles[payment.status] || 'bg-gray-100 text-gray-800'
          }`}
        >
          {PAYMENT_STATUS_LABELS[payment.status]}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <div className="text-xs text-gray-500">Method</div>
          <div className="text-sm text-gray-900">{PAYMENT_METHOD_LABELS[payment.paymentMethod]}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Amount</div>
          <div className="text-sm font-semibold text-gray-900">${formattedAmount}</div>
        </div>
      </div>

      {payment.receiptFileUrl && (
        <div className="pt-3 border-t border-gray-200">
          {isAdmin && onViewReceipt ? (
            <button
              onClick={() => onViewReceipt(payment)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-gray-200"
              aria-label="View payment receipt"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              <span className="text-sm font-medium">View Receipt</span>
            </button>
          ) : (
            <button
              onClick={() => onOpenReceipt?.(payment.id)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-gray-200"
              aria-label="View payment receipt (opens in new tab)"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              <span className="text-sm font-medium">View Receipt</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default memo(MobilePaymentCard);
