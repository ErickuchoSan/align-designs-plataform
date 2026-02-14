'use client';

import Modal from '@/components/ui/Modal';
import PaymentHistoryTable from './PaymentHistoryTable';
import { Payment } from '@/types/payments';

interface PaymentHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  payments: Payment[];
  isLoading: boolean;
  onViewReceipt?: (payment: Payment) => void;
  isAdmin?: boolean;
  projectName?: string;
  amountPaid?: number;
  amountRequired?: number;
}

export default function PaymentHistoryModal({
  isOpen,
  onClose,
  payments,
  isLoading,
  onViewReceipt,
  isAdmin,
  projectName,
  amountPaid,
  amountRequired,
}: PaymentHistoryModalProps) {

  const additionalHeaderContent = amountPaid !== undefined && amountRequired !== undefined ? (
    <p className="text-xs sm:text-sm text-gray-500 mt-1 break-words font-normal">
      Amount Paid: <span className="font-semibold text-green-600">${Number(amountPaid).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
      {' '} of ${Number(amountRequired).toLocaleString('en-US', { minimumFractionDigits: 2 })} required
    </p>
  ) : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Payment History${projectName ? ` - ${projectName}` : ''}`}
      size="4xl"
    >
      {additionalHeaderContent && (
        <div className="mb-4 pb-4 border-b border-gray-100">
          {additionalHeaderContent}
        </div>
      )}
      <div className="max-h-[65vh] overflow-y-auto -mx-4 px-4 sm:-mx-6 sm:px-6">
        <PaymentHistoryTable
          payments={payments}
          isLoading={isLoading}
          onViewReceipt={onViewReceipt}
          isAdmin={isAdmin}
        />
      </div>

      <div className="mt-6 flex justify-end pt-4 border-t border-gray-100">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-stone-600 hover:bg-stone-700 text-white rounded-lg font-medium transition-colors"
        >
          Close
        </button>
      </div>
    </Modal>
  );
}
