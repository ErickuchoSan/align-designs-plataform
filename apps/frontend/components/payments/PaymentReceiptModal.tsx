import { useState, useEffect, useCallback, useRef } from 'react';
import Modal from '@/components/ui/Modal';
import { Payment } from '@/types/payments';
import { EmployeePayment } from '@/types/employee-payment';
import { PaymentsService } from '@/services/payments.service';
import { EmployeePaymentsService } from '@/services/employee-payments.service';
import { handleApiError } from '@/lib/errors';
import { toast } from '@/lib/toast';
import { USE_BLOB_URLS } from '@/hooks';
import { formatDate } from '@/lib/date.utils';

interface PaymentReceiptModalProps {
    isOpen: boolean;
    onClose: () => void;
    payment?: Payment | EmployeePayment;
}

function isEmployeePayment(payment: Payment | EmployeePayment): payment is EmployeePayment {
    return 'employeeId' in payment;
}

function checkHasReceipt(payment?: Payment | EmployeePayment): boolean {
    if (!payment) return false;
    if (isEmployeePayment(payment)) {
        return !!(payment.receiptFileId || payment.receiptFile);
    }
    return !!(payment.receiptFileUrl);
}

export default function PaymentReceiptModal({
    isOpen,
    onClose,
    payment,
}: Readonly<PaymentReceiptModalProps>) {
    // Receipt URL state (blob or presigned URL)
    const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
    const [receiptType, setReceiptType] = useState<'pdf' | 'image' | null>(null);
    const [loadingReceipt, setLoadingReceipt] = useState(false);
    const [receiptError, setReceiptError] = useState<string | null>(null);
    const blobUrlRef = useRef<string | null>(null);

    const hasReceipt = checkHasReceipt(payment);

    // Load receipt (as blob or presigned URL based on config)
    const loadReceipt = useCallback(async () => {
        if (!payment || !hasReceipt) return;

        setLoadingReceipt(true);
        setReceiptError(null);
        setReceiptType(null);

        try {
            if (USE_BLOB_URLS) {
                // Blob mode: download file and create object URL
                const blob = isEmployeePayment(payment)
                    ? await EmployeePaymentsService.downloadReceipt(payment.id)
                    : await PaymentsService.downloadReceipt(payment.id);

                const url = globalThis.URL.createObjectURL(blob);
                blobUrlRef.current = url;
                setReceiptUrl(url);

                const isPdf = blob.type === 'application/pdf' || blob.type.includes('pdf');
                setReceiptType(isPdf ? 'pdf' : 'image');
            } else {
                // Direct URL mode: use presigned URL from API
                const url = isEmployeePayment(payment)
                    ? await EmployeePaymentsService.getReceiptUrl(payment.id)
                    : await PaymentsService.getReceiptUrl(payment.id);
                setReceiptUrl(url);
                // Detect type from URL extension
                const isPdf = url.toLowerCase().includes('.pdf');
                setReceiptType(isPdf ? 'pdf' : 'image');
            }
        } catch (error) {
            setReceiptError(handleApiError(error, 'Could not load receipt'));
        } finally {
            setLoadingReceipt(false);
        }
    }, [payment, hasReceipt]);

    // Load receipt when modal opens
    useEffect(() => {
        if (isOpen && payment && hasReceipt) {
            loadReceipt();
        }
        return () => {
            // Only revoke if using blob URLs
            if (USE_BLOB_URLS && blobUrlRef.current) {
                globalThis.URL.revokeObjectURL(blobUrlRef.current);
                blobUrlRef.current = null;
            }
            setReceiptUrl(null);
        };
    }, [isOpen, payment, hasReceipt, loadReceipt]);

    const handleOpenReceiptNewTab = async () => {
        if (!payment) return;
        try {
            if (USE_BLOB_URLS) {
                const blob = isEmployeePayment(payment)
                    ? await EmployeePaymentsService.downloadReceipt(payment.id)
                    : await PaymentsService.downloadReceipt(payment.id);
                const url = globalThis.URL.createObjectURL(blob);
                globalThis.open(url, '_blank');
            } else {
                const url = isEmployeePayment(payment)
                    ? await EmployeePaymentsService.getReceiptUrl(payment.id)
                    : await PaymentsService.getReceiptUrl(payment.id);
                globalThis.open(url, '_blank');
            }
        } catch (error) {
            toast.error(handleApiError(error, 'Could not open receipt'));
        }
    };

    if (!payment) return null;

    const amount = Number(payment.amount);
    const paymentDate = new Date(payment.paymentDate);
    const method = payment.paymentMethod.replaceAll('_', ' ');
    const status = payment.status.replaceAll('_', ' ');

    const notes = isEmployeePayment(payment) ? payment.description : payment.notes;
    const rejectionReason = payment.rejectionReason;

    const getStatusColor = (status: string) => {
        const s = status.toUpperCase();
        if (s.includes('PENDING')) return 'bg-yellow-100 text-yellow-800';
        if (s.includes('CONFIRM') || s.includes('APPROV')) return 'bg-green-100 text-green-800';
        if (s.includes('REJECT')) return 'bg-red-100 text-red-800';
        return 'bg-yellow-100 text-yellow-800';
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Payment Details" size="xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column: Details */}
                <div className="space-y-6">
                    <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                        <h4 className="font-semibold text-navy-900">Payment Information</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-gray-500">Amount</p>
                                <p className="font-bold text-lg text-green-600">
                                    ${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                            <div>
                                <p className="text-gray-500">Date</p>
                                <p className="font-medium text-gray-900">
                                    {formatDate(paymentDate)}
                                </p>
                            </div>
                            <div>
                                <p className="text-gray-500">Method</p>
                                <p className="font-medium text-gray-900 capitalize">{method}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Status</p>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                                    {status}
                                </span>
                            </div>
                        </div>

                        {notes && (
                            <div className="border-t border-gray-200 pt-3 mt-3">
                                <p className="text-gray-500 mb-1">Notes:</p>
                                <p className="text-gray-700 italic">"{notes}"</p>
                            </div>
                        )}

                        {rejectionReason && (
                            <div className="border-t border-gray-200 pt-3 mt-3 bg-red-50 p-2 rounded">
                                <p className="text-red-700 font-medium mb-1">Rejection Reason:</p>
                                <p className="text-red-600">"{rejectionReason}"</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Receipt Preview */}
                <div className="bg-gray-100 rounded-lg border border-gray-200 overflow-hidden flex flex-col h-[500px]">
                    <div className="bg-gray-200 px-4 py-2 border-b border-gray-300 flex justify-between items-center">
                        <span className="font-medium text-gray-700 text-sm">Receipt Preview</span>
                        {hasReceipt && (
                            <button
                                type="button"
                                onClick={handleOpenReceiptNewTab}
                                className="text-navy-600 hover:text-navy-800 text-xs font-medium flex items-center gap-1"
                            >
                                Open in new tab
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                            </button>
                        )}
                    </div>
                    <div className="flex-1 bg-white relative flex items-center justify-center overflow-hidden">
                        {loadingReceipt && (
                            <div className="flex flex-col items-center justify-center gap-2 text-gray-500">
                                <svg className="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                <span className="text-sm">Loading receipt...</span>
                            </div>
                        )}
                        {receiptError && (
                            <div className="flex flex-col items-center justify-center gap-2 text-red-500 text-center p-4">
                                <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <span className="text-sm">{receiptError}</span>
                                <button
                                    type="button"
                                    onClick={loadReceipt}
                                    className="text-xs text-navy-600 hover:text-navy-800 underline"
                                >
                                    Try again
                                </button>
                            </div>
                        )}
                        {receiptUrl && !loadingReceipt && !receiptError && receiptType === 'pdf' && (
                            <iframe
                                src={receiptUrl}
                                className="w-full h-full border-0"
                                title="Receipt Preview"
                            />
                        )}
                        {receiptUrl && !loadingReceipt && !receiptError && receiptType === 'image' && (
                            <div className="flex items-center justify-center h-full p-4 overflow-auto">
                                {/* eslint-disable-next-line @next/next/no-img-element -- blob URL with unknown dimensions */}
                                <img
                                    src={receiptUrl}
                                    alt="Payment Receipt"
                                    className="max-w-full max-h-full object-contain rounded shadow-sm"
                                />
                            </div>
                        )}
                        {!hasReceipt && !loadingReceipt && (
                            <div className="text-center p-4">
                                <svg className="w-12 h-12 mx-auto text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <p className="text-gray-500 font-medium">No receipt available</p>
                                <p className="text-gray-400 text-sm mt-1">This payment does not have an attached receipt file.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="mt-6 flex justify-end">
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
