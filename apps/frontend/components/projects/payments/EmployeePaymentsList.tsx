'use client';

import { memo } from 'react';
import { EmployeePayment, EmployeePaymentStatus } from '@/types/employee-payment';
import { formatCurrency } from '@/lib/utils/currency.utils';
import { formatDate } from '@/lib/date.utils';
import { CheckIcon, CloseIcon } from '@/components/ui/icons';
import PaymentEmptyState from './PaymentEmptyState';

const PaymentIcon = () => (
  <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const getStatusColor = (status: EmployeePaymentStatus): string => {
  switch (status) {
    case EmployeePaymentStatus.APPROVED:
      return 'bg-green-100 text-green-800';
    case EmployeePaymentStatus.PENDING:
      return 'bg-yellow-100 text-yellow-800';
    case EmployeePaymentStatus.REJECTED:
      return 'bg-red-100 text-red-800';
    case EmployeePaymentStatus.CANCELLED:
      return 'bg-[#F5F4F0] text-[#6B6A65]';
    default:
      return 'bg-[#F5F4F0] text-[#6B6A65]';
  }
};

interface EmployeePaymentsListProps {
  payments: EmployeePayment[];
  userRole: 'ADMIN' | 'EMPLOYEE';
  onViewReceipt: (payment: EmployeePayment) => void;
  onApprove?: (paymentId: string) => void;
  onReject?: (paymentId: string) => void;
}

function EmployeePaymentsList({
  payments,
  userRole,
  onViewReceipt,
  onApprove,
  onReject,
}: Readonly<EmployeePaymentsListProps>) {
  const isAdmin = userRole === 'ADMIN';

  if (payments.length === 0) {
    return (
      <PaymentEmptyState
        icon={<PaymentIcon />}
        message="No payments yet"
        hint={isAdmin ? 'Click "Pay Employee" to create one' : undefined}
      />
    );
  }

  return (
    <div className="space-y-3">
      {payments.map((payment) => (
        <div
          key={payment.id}
          className="flex items-center justify-between p-4 bg-[#F5F4F0] rounded-lg hover:bg-[#F5F4F0] transition-colors"
        >
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <p className="font-medium text-[#1B1C1A]">
                {isAdmin && payment.employee
                  ? `${payment.employee.firstName} ${payment.employee.lastName}`
                  : 'Payment'}
              </p>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                {payment.status}
              </span>
            </div>
            <div className="text-sm text-[#6B6A65] space-y-1">
              <p>Amount: {formatCurrency(Number(payment.amount))}</p>
              <p>Method: {payment.paymentMethod}</p>
              <p>Date: {formatDate(payment.paymentDate)}</p>
              {payment.description && <p>Note: {payment.description}</p>}
              {payment.rejectionReason && (
                <p className="text-red-600">Rejection Reason: {payment.rejectionReason}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Details Button */}
            {(payment.status === 'APPROVED' || payment.receiptFileId || payment.receiptFile) && (
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

            {/* Admin Actions */}
            {isAdmin && payment.status === EmployeePaymentStatus.PENDING && onApprove && onReject && (
              <>
                <button
                  onClick={() => onApprove(payment.id)}
                  className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                  aria-label="Approve payment"
                >
                  <CheckIcon size="md" aria-hidden="true" />
                </button>
                <button
                  onClick={() => onReject(payment.id)}
                  className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                  aria-label="Reject payment"
                >
                  <CloseIcon size="md" aria-hidden="true" />
                </button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default memo(EmployeePaymentsList);
