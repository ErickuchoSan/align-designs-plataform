import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { toast } from 'react-hot-toast';
import { Payment, PaymentStatus } from '@/types/payments';
import { PaymentsService } from '@/services/payments.service';

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
}: AdminPaymentReviewModalProps) {
  const [processing, setProcessing] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isEditingAmount, setIsEditingAmount] = useState(false);
  const [correctedAmount, setCorrectedAmount] = useState<string>('');

  if (!payment) return null;

  const handleApprove = async () => {
    setProcessing(true);
    try {
      const finalAmount = isEditingAmount && correctedAmount ? Number(correctedAmount) : undefined;
      await PaymentsService.approve(payment.id, finalAmount);
      toast.success('Payment approved successfully');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error approving payment:', error);
      toast.error('Failed to approve payment');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Rejection reason is required');
      return;
    }

    setProcessing(true);
    try {
      await PaymentsService.reject(payment.id, rejectionReason);
      toast.success('Payment rejected');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error rejecting payment:', error);
      toast.error('Failed to reject payment');
    } finally {
      setProcessing(false);
    }
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
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-full p-2 sm:p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl p-4 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-xl sm:p-6 sm:rounded-2xl">
                <Dialog.Title as="h3" className="flex items-center justify-between mb-4 text-lg font-bold leading-6 text-navy-900 sm:text-xl">
                  Review Payment
                  <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </Dialog.Title>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 sm:gap-6">
                  {/* Left Column: Details & Actions */}
                  <div className="space-y-4 sm:space-y-6">
                    <div className="p-3 space-y-3 bg-gray-50 rounded-lg sm:p-4">
                      <h4 className="text-sm font-semibold text-navy-900 sm:text-base">Payment Details</h4>
                      <div className="grid grid-cols-2 gap-3 text-sm sm:gap-4">
                        <div>
                          <p className="text-gray-500">Amount</p>
                          <p className="font-bold text-lg text-green-600">
                            ${Number(payment.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Date</p>
                          <p className="font-medium text-gray-900">
                            {new Date(payment.paymentDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Method</p>
                          <p className="font-medium text-gray-900 capitalize">{payment.paymentMethod.replace('_', ' ')}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Currently</p>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${payment.status === PaymentStatus.CONFIRMED ? 'bg-green-100 text-green-800' :
                            payment.status === PaymentStatus.REJECTED ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                            {payment.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                      {payment.notes && (
                        <div className="border-t border-gray-200 pt-3 mt-3">
                          <p className="text-gray-500 mb-1">Customer Notes:</p>
                          <p className="text-gray-700 italic">"{payment.notes}"</p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    {payment.status === PaymentStatus.PENDING_APPROVAL && (
                      <div className="space-y-4">
                        {!rejecting ? (
                          <div className="space-y-3">
                            {isEditingAmount ? (
                              <div className="p-4 border rounded-lg bg-navy-50 border-navy-100 animate-in fade-in slide-in-from-top-2">
                                <h5 className="mb-2 text-sm font-semibold text-navy-800">Correct Payment Amount</h5>
                                <p className="mb-2 text-xs text-navy-600">Original amount: ${Number(payment.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                                <div className="flex items-center gap-2 mb-3">
                                  <span className="text-gray-500 font-medium">$</span>
                                  <input
                                    type="number"
                                    value={correctedAmount}
                                    onChange={(e) => setCorrectedAmount(e.target.value)}
                                    className="block w-full rounded-md border-stone-300 shadow-sm focus:border-navy-500 focus:ring-navy-500 sm:text-sm"
                                    placeholder="0.00"
                                  />
                                </div>
                              </div>
                            ) : null}

                            <div className="flex flex-col gap-2 sm:flex-row">
                              <button
                                onClick={handleApprove}
                                disabled={processing}
                                className="flex items-center justify-center flex-1 gap-2 py-2.5 font-semibold text-white transition-colors bg-green-600 rounded-lg shadow-sm hover:bg-green-700 disabled:opacity-50 sm:py-3"
                              >
                                {processing ? 'Processing...' : (
                                  <>
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
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
                                  title="Approve with Amount Correction"
                                >
                                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                                  className="text-xs text-gray-500 hover:text-gray-700 underline"
                                >
                                  Cancel Correction
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="bg-red-50 p-4 rounded-lg border border-red-100 animate-in fade-in slide-in-from-top-2">
                            <h5 className="font-semibold text-red-800 mb-2">Rejection Reason</h5>
                            <textarea
                              value={rejectionReason}
                              onChange={(e) => setRejectionReason(e.target.value)}
                              placeholder="Please explain why this payment is being rejected..."
                              className="w-full rounded-md border-red-200 shadow-sm focus:border-red-500 focus:ring-red-500 text-sm mb-3"
                              rows={3}
                            />
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => setRejecting(false)}
                                className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-800"
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
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Receipt Preview */}
                  <div className="bg-gray-100 rounded-lg border border-gray-200 overflow-hidden flex flex-col h-[500px]">
                    <div className="bg-gray-200 px-4 py-2 border-b border-gray-300 flex justify-between items-center">
                      <span className="font-medium text-gray-700 text-sm">Receipt Preview</span>
                      <a
                        href={receiptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-xs font-medium gap-1 text-navy-600 hover:text-navy-800"
                      >
                        Open in new tab
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                    <div className="flex-1 bg-white relative">
                      <iframe
                        src={receiptUrl}
                        className="w-full h-full border-0"
                        title="Receipt Preview"
                      />
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
