import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from '@/lib/toast';
import { Payment, PaymentStatus } from '@/types/payments';
import { PaymentsService } from '@/services/payments.service';
import Modal from '@/components/ui/Modal';
import { useApprovePaymentMutation, useRejectPaymentMutation } from '@/hooks/queries';
import { CheckIcon } from '@/components/ui/icons';
import { cn, INPUT_BASE, INPUT_VARIANTS, TEXTAREA_BASE } from '@/lib/styles';
import { handleApiError } from '@/lib/errors';
import { formatDate } from '@/lib/date.utils';

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
  // TanStack Query mutations
  const approveMutation = useApprovePaymentMutation();
  const rejectMutation = useRejectPaymentMutation();

  const [rejecting, setRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isEditingAmount, setIsEditingAmount] = useState(false);
  const [correctedAmount, setCorrectedAmount] = useState<string>('');

  // Receipt blob URL state
  const [receiptBlobUrl, setReceiptBlobUrl] = useState<string | null>(null);
  const [receiptType, setReceiptType] = useState<'pdf' | 'image' | null>(null);
  const [loadingReceipt, setLoadingReceipt] = useState(false);
  const [receiptError, setReceiptError] = useState<string | null>(null);
  // Ref to track current blob URL for cleanup
  const blobUrlRef = useRef<string | null>(null);

  const processing = approveMutation.isPending || rejectMutation.isPending;

  // Load receipt as blob when modal opens
  const loadReceipt = useCallback(async (paymentId: string) => {
    setLoadingReceipt(true);
    setReceiptError(null);
    setReceiptType(null);
    try {
      const blob = await PaymentsService.downloadReceipt(paymentId);
      const url = globalThis.URL.createObjectURL(blob);
      blobUrlRef.current = url;
      setReceiptBlobUrl(url);
      // Detect file type from MIME
      const isPdf = blob.type === 'application/pdf' || blob.type.includes('pdf');
      setReceiptType(isPdf ? 'pdf' : 'image');
    } catch (error) {
      setReceiptError(handleApiError(error, 'Could not load receipt'));
    } finally {
      setLoadingReceipt(false);
    }
  }, []);

  // Load receipt when modal opens
  useEffect(() => {
    if (isOpen && payment?.id) {
      loadReceipt(payment.id);
    }
    // Cleanup blob URL when modal closes
    return () => {
      if (blobUrlRef.current) {
        globalThis.URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
        setReceiptBlobUrl(null);
      }
    };
  }, [isOpen, payment?.id, loadReceipt]);

  if (!payment) return null;

  const handleApprove = async () => {
    const finalAmount = isEditingAmount && correctedAmount ? Number(correctedAmount) : undefined;
    approveMutation.mutate(
      { paymentId: payment.id, correctedAmount: finalAmount },
      {
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

    rejectMutation.mutate(
      { paymentId: payment.id, reason: rejectionReason },
      {
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

  const handleOpenReceiptNewTab = async () => {
    try {
      const blob = await PaymentsService.downloadReceipt(payment.id);
      const url = globalThis.URL.createObjectURL(blob);
      globalThis.open(url, '_blank');
    } catch (error) {
      toast.error(handleApiError(error, 'Could not open receipt'));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Review Payment" size="2xl">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Left Column: Details & Actions */}
        <div className="space-y-4 sm:space-y-6 lg:col-span-2">
          <div className="p-3 space-y-3 rounded-lg bg-[#F5F4F0] sm:p-4">
            <h4 className="text-sm font-semibold text-[#1B1C1A] sm:text-base">Payment Details</h4>
            <div className="grid grid-cols-2 gap-3 text-sm sm:gap-4">
              <div>
                <p className="text-[#6B6A65]">Amount</p>
                <p className="font-bold text-lg text-green-600">
                  ${Number(payment.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p className="text-[#6B6A65]">Date</p>
                <p className="font-medium text-[#1B1C1A]">
                  {formatDate(payment.paymentDate)}
                </p>
              </div>
              <div>
                <p className="text-[#6B6A65]">Method</p>
                <p className="font-medium capitalize text-[#1B1C1A]">{payment.paymentMethod.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-[#6B6A65]">Currently</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(payment.status)}`}>
                  {payment.status.replace('_', ' ')}
                </span>
              </div>
            </div>
            {payment.notes && (
              <div className="pt-3 mt-3 border-t border-[#D0C5B2]/20">
                <p className="mb-1 text-[#6B6A65]">Customer Notes:</p>
                <p className="italic text-[#6B6A65]">&ldquo;{payment.notes}&rdquo;</p>
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
                      className="px-3 py-1.5 text-sm font-medium text-[#6B6A65] hover:text-[#1B1C1A]"
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
                    <div className="p-4 border rounded-lg bg-[#F5F4F0] border-[#D0C5B2]/20 animate-in fade-in slide-in-from-top-2">
                      <h5 className="mb-2 text-sm font-semibold text-[#1B1C1A]">Correct Payment Amount</h5>
                      <p className="mb-2 text-xs text-[#6B6A65]">Original amount: ${Number(payment.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="font-medium text-[#6B6A65]">$</span>
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

                  <div className="flex flex-col gap-3">
                    {/* Primary action: Approve */}
                    <button
                      onClick={handleApprove}
                      disabled={processing}
                      className="flex items-center justify-center w-full gap-2 px-4 py-3 font-semibold text-white transition-colors bg-green-600 rounded-lg shadow-sm hover:bg-green-700 disabled:opacity-50"
                    >
                      {processing ? 'Processing...' : (
                        <>
                          <CheckIcon size="md" />
                          <span>{isEditingAmount ? 'Confirm with Changes' : 'Approve Payment'}</span>
                        </>
                      )}
                    </button>

                    {/* Secondary actions row */}
                    <div className="flex gap-2">
                      {!isEditingAmount && (
                        <button
                          onClick={toggleEditAmount}
                          disabled={processing}
                          className="flex items-center justify-center gap-2 px-4 py-2.5 font-medium transition-colors border rounded-lg text-[#1B1C1A] bg-[#F5F4F0] border-[#D0C5B2]/20 hover:bg-[#F5F4F0] disabled:opacity-50"
                          aria-label="Edit payment amount before approval"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          <span className="hidden sm:inline">Edit Amount</span>
                        </button>
                      )}

                      <button
                        onClick={() => setRejecting(true)}
                        disabled={processing}
                        className={cn(
                          "flex-1 px-4 py-2.5 font-semibold text-red-600 transition-colors bg-white border border-red-300 rounded-lg shadow-sm hover:bg-red-50 disabled:opacity-50",
                          isEditingAmount && "w-full"
                        )}
                      >
                        Reject
                      </button>
                    </div>
                  </div>

                  {isEditingAmount && (
                    <div className="text-center">
                      <button
                        onClick={toggleEditAmount}
                        className="text-xs underline text-[#6B6A65] hover:text-[#1B1C1A]"
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
        <div className="flex flex-col overflow-hidden border rounded-lg bg-[#F5F4F0] border-[#D0C5B2]/20 lg:col-span-3 min-h-[400px] lg:min-h-[600px]">
          <div className="flex items-center justify-between px-4 py-2 border-b bg-[#F5F4F0] border-[#D0C5B2]/20">
            <span className="text-sm font-medium text-[#6B6A65]">Receipt Preview</span>
            <button
              type="button"
              onClick={handleOpenReceiptNewTab}
              className="flex items-center text-xs font-medium gap-1 text-[#C9A84C] hover:text-[#755B00]"
              aria-label="Open receipt in new tab"
            >
              Open in new tab
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </button>
          </div>
          <div className="flex-1 bg-white overflow-hidden">
            {loadingReceipt && (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-[#6B6A65]">
                <svg className="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span className="text-sm">Loading receipt...</span>
              </div>
            )}
            {receiptError && (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-red-500 text-center p-4">
                <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="text-sm">{receiptError}</span>
                <button
                  type="button"
                  onClick={() => loadReceipt(payment.id)}
                  className="text-xs text-[#C9A84C] hover:text-[#755B00] underline"
                >
                  Try again
                </button>
              </div>
            )}
            {receiptBlobUrl && !loadingReceipt && !receiptError && receiptType === 'pdf' && (
              <iframe
                src={receiptBlobUrl}
                title="Payment Receipt PDF"
                className="w-full h-full border-0"
              />
            )}
            {receiptBlobUrl && !loadingReceipt && !receiptError && receiptType === 'image' && (
              <div className="flex items-center justify-center h-full p-4 overflow-auto">
                {/* eslint-disable-next-line @next/next/no-img-element -- blob URL with unknown dimensions */}
                <img
                  src={receiptBlobUrl}
                  alt="Payment Receipt"
                  className="max-w-full max-h-full object-contain rounded shadow-sm"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}