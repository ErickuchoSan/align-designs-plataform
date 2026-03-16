import Modal from '@/components/ui/Modal';
import { Payment } from '@/types/payments';
import { EmployeePayment } from '@/types/employee-payment';

interface PaymentReceiptModalProps {
    isOpen: boolean;
    onClose: () => void;
    payment?: Payment | EmployeePayment;
}

function isEmployeePayment(payment: Payment | EmployeePayment): payment is EmployeePayment {
    return 'employeeId' in payment;
}

export default function PaymentReceiptModal({
    isOpen,
    onClose,
    payment,
}: PaymentReceiptModalProps) {
    if (!payment) return null;

    const hasReceipt = isEmployeePayment(payment)
        ? !!(payment.receiptFileId || payment.receiptFile)
        : !!(payment.receiptFileUrl);

    const getReceiptUrl = (): string | null => {
        if (!hasReceipt) return null;
        if (isEmployeePayment(payment)) {
            return `${process.env.NEXT_PUBLIC_API_URL}/employee-payments/${payment.id}/receipt`;
        }
        return `${process.env.NEXT_PUBLIC_API_URL}/payments/${payment.id}/receipt`;
    };
    const receiptUrl = getReceiptUrl();

    const amount = Number(payment.amount);
    const paymentDate = new Date(payment.paymentDate);
    const method = payment.paymentMethod.replace(/_/g, ' ');
    const status = payment.status.replace(/_/g, ' ');

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
                                    {paymentDate.toLocaleDateString()}
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
                        {receiptUrl && (
                            <a
                                href={receiptUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-navy-600 hover:text-navy-800 text-xs font-medium flex items-center gap-1"
                            >
                                Open in new tab
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                            </a>
                        )}
                    </div>
                    <div className="flex-1 bg-white relative flex items-center justify-center">
                        {receiptUrl ? (
                            <iframe
                                src={receiptUrl}
                                className="w-full h-full border-0"
                                title="Receipt Preview"
                            />
                        ) : (
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
