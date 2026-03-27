'use client';

import { memo } from 'react';

interface PaymentActionsProps {
  userRole: 'ADMIN' | 'CLIENT' | 'EMPLOYEE';
  onGenerateInvoice?: () => void;
  onPayEmployee?: () => void;
  onUploadPaymentProof?: () => void;
  onPreviewInvoice?: () => void;
}

function PaymentActions({
  userRole,
  onGenerateInvoice,
  onPayEmployee,
  onUploadPaymentProof,
  onPreviewInvoice,
}: Readonly<PaymentActionsProps>) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
      {userRole === 'ADMIN' && (
        <>
          <button
            onClick={onGenerateInvoice}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-br from-[#755B00] to-[#C9A84C] text-white rounded-lg font-medium hover:brightness-95 transition-colors text-sm sm:text-base"
          >
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span className="whitespace-nowrap">Generate Invoice</span>
          </button>
          <button
            onClick={onPayEmployee}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors text-sm sm:text-base"
          >
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="whitespace-nowrap">Pay Employee</span>
          </button>
          <button
            onClick={onPreviewInvoice}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition-colors text-sm sm:text-base"
            title="Preview how invoices look (Admin only)"
          >
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
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
            <span className="whitespace-nowrap">Preview Invoice</span>
          </button>
        </>
      )}

      {userRole === 'CLIENT' && (
        <button
          onClick={onUploadPaymentProof}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-br from-[#755B00] to-[#C9A84C] text-white rounded-lg font-medium hover:brightness-95 transition-colors text-sm sm:text-base"
        >
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <span className="whitespace-nowrap">Upload Payment Proof</span>
        </button>
      )}
    </div>
  );
}

export default memo(PaymentActions);
