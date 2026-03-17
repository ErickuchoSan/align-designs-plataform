import { useState } from 'react';
import { toast } from '@/lib/toast';
import { Payment, PaymentStatus } from '@/types/payments';
import { PaymentsService } from '@/services/payments.service';
import Modal from '@/components/ui/Modal';
import { useAsyncOperation } from '@/hooks';
import { CheckIcon } from '@/components/ui/icons';
import { cn, INPUT_BASE, INPUT_VARIANTS, TEXTAREA_BASE } from '@/lib/styles';

// Helper function to get payment status badge style
function getStatusBadgeClass(status: PaymentStatus): string {
  const statusStyles: Record<PaymentStatus, string> = {
    [PaymentStatus.CONFIRMED]: 'bg-green-100 text-green-800',
    [PaymentStatus.REJECTED]: 'bg-red-100 text-red-800',
    [PaymentStatus.PENDING_APPROVAL]: 'bg-yellow-100 text-yellow-800',
    [PaymentStatus.PENDING_CONFIRMATION]: 'bg-blue-100 text-blue-800',
  };
  return statusStyles[status] || 'bg-gray-100 text-gray-800';
}

interface AdminPaymentReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment?: Payment;
  onSuccess?: () => void;
}

export default function AdminPaymentReviewModal({
  isOpen,
  onClose,
  payment,
  onSuccess,
}: Readonly<AdminPaymentReviewModalProps>) {
  // DRY: Use useAsyncOperation for approve/reject handling
  const { loading: processing, execute } = useAsyncOperation();
  const [rejecting, setRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isEditingAmount, setIsEditingAmount] = useState(false);
  const [correctedAmount, setCorrectedAmount] = useState<string>('');

  if (!payment) return null;

  const handleApprove = async () => {
    const finalAmount = isEditingAmount && correctedAmount ? Number(correctedAmount) : undefined;
    await execute(
      () => PaymentsService.approve(payment.id, finalAmount),
      {
        successMessage: 'Payment approved successfully',
        errorMessagePrefix: 'Failed to approve payment',
        onSuccess: () => {
          onSuccess?.();
          onClose();
        },
      }
    );
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Rejection reason is required');
      return;
    }

    await execute(
      () => PaymentsService.reject(payment.id, rejectionReason),
      {
        successMessage: 'Payment rejected',
        errorMessagePrefix: 'Failed to reject payment',
        onSuccess: () => {
          onSuccess?.();
          onClose();
        },
      }
    );
  };

  const toggleEditAmount = () => {
    if (isEditingAmount) {
      setIsEditingAmount(false);
      setCorrectedAmount('');
    } else {
      setIsEditingAmount(true);
      setCorrectedAmount(payment.amount.toString());
    }
  };

  const receiptUrl = `${process.env.NEXT_PUBLIC_API_URL}/payments/${payment.id}/receipt`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Review Payment" size="2xl">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Left Column: Details & Actions */}
        <div className="space-y-4 sm:space-y-6 lg:col-span-2">
          <div className="p-3 space-y-3 rounded-lg bg-stone-50 sm:p-4">
            <h4 className="text-sm font-semibold text-navy-900 sm:text-base">Payment Details</h4>
            <div className="grid grid-cols-2 gap-3 text-sm sm:gap-4">
              <div>
                <p className="text-stone-500">Amount</p>
                <p className="font-bold text-lg text-green-600">
                  ${Number(payment.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p className="text-stone-500">Date</p>
                <p className="font-medium text-stone-900">
                  {new Date(payment.paymentDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-stone-500">Method</p>
                <p className="font-medium capitalize text-stone-900">{payment.paymentMethod.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-stone-500">Currently</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(payment.status)}`}>
                  {payment.status.replace('_', ' ')}
                </span>
              </div>
            </div>
            {payment.notes && (
              <div className="pt-3 mt-3 border-t border-stone-200">
                <p className="mb-1 text-stone-500">Customer Notes:</p>
                <p className="italic text-stone-700">"{payment.notes}"</p>
              </div>
            )}
          </div>

          {/* Actions */}
          {payment.status === PaymentStatus.PENDING_APPROVAL && (
            <div className="space-y-4">
              {rejecting ? (
                <div className="bg-red-50 p-4 rounded-lg border border-red-100 animate-in fade-in slide-in-from-top-2">
                  <h5 className="font-semibold text-red-800 mb-2">Rejection Reason</h5>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Please explain why this payment is being rejected..."
                    className={cn(TEXTAREA_BASE, 'border-red-200 focus:ring-red-500 focus:border-red-500 mb-3')}
                    rows={3}
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setRejecting(false)}
                      className="px-3 py-1.5 text-sm font-medium text-stone-600 hover:text-stone-800"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleReject}
                      disabled={processing || !rejectionReason.trim()}
                      className="px-4 py-1.5 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                    >
                      {processing ? 'Rejecting...' : 'Confirm Rejection'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {isEditingAmount && (
                    <div className="p-4 border rounded-lg bg-navy-50 border-navy-100 animate-in fade-in slide-in-from-top-2">
                      <h5 className="mb-2 text-sm font-semibold text-navy-800">Correct Payment Amount</h5>
                      <p className="mb-2 text-xs text-navy-600">Original amount: ${Number(payment.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="font-medium text-stone-500">$</span>
                        <input
                          type="number"
                          value={correctedAmount}
                          onChange={(e) => setCorrectedAmount(e.target.value)}
                          className={cn(INPUT_BASE, INPUT_VARIANTS.default)}
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <button
                      onClick={handleApprove}
                      disabled={processing}
                      className="flex items-center justify-center flex-1 gap-2 py-2.5 font-semibold text-white transition-colors bg-green-600 rounded-lg shadow-sm hover:bg-green-700 disabled:opacity-50 sm:py-3"
                    >
                      {processing ? 'Processing...' : (
                        <>
                          <CheckIcon size="md" />
                          <span className="hidden sm:inline">{isEditingAmount ? 'Confirm with Changes' : 'Approve Payment'}</span>
                          <span className="sm:hidden">{isEditingAmount ? 'Confirm' : 'Approve'}</span>
                        </>
                      )}
                    </button>

                    {!isEditingAmount && (
                      <button
                        onClick={toggleEditAmount}
                        disabled={processing}
                        className="flex items-center justify-center gap-2 px-3 py-2.5 font-medium transition-colors border rounded-lg shadow-sm text-navy-700 bg-navy-50 border-navy-200 sm:px-4 sm:py-3 hover:bg-navy-100 disabled:opacity-50 tooltip-trigger"
                        aria-label="Edit payment amount before approval"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    )}

                    <button
                      onClick={() => setRejecting(true)}
                      disabled={processing}
                      className="px-4 py-2.5 font-semibold text-red-600 transition-colors bg-white border border-red-300 rounded-lg shadow-sm sm:px-6 sm:py-3 hover:bg-red-50 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>

                  {isEditingAmount && (
                    <div className="text-center">
                      <button
                        onClick={toggleEditAmount}
                        className="text-xs underline text-stone-500 hover:text-stone-700"
                      >
                        Cancel Correction
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Receipt Preview */}
        <div className="flex flex-col overflow-hidden border rounded-lg bg-stone-100 border-stone-200 lg:col-span-3 min-h-[400px] lg:min-h-[600px]">
          <div className="flex items-center justify-between px-4 py-2 border-b bg-stone-200 border-stone-300">
            <span className="text-sm font-medium text-stone-700">Receipt Preview</span>
            <a
              href={receiptUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-xs font-medium gap-1 text-navy-600 hover:text-navy-800"
              aria-label="Open receipt in new tab"
            >
              Open in new tab
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
          <div className="flex-1 bg-white">
            <iframe
              src={receiptUrl}
              className="w-full h-full border-0"
              title="Receipt Preview"
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}
