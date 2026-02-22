import { memo, useMemo } from 'react';
import { Payment, PAYMENT_METHOD_LABELS, PAYMENT_TYPE_LABELS, PAYMENT_STATUS_LABELS } from '../../types/payments';
import MobilePaymentCard from './MobilePaymentCard';

// Create a simple format date if it doesn't exist or use Intl
const formatDateSimple = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};

// Format currency once and memoize
const formatCurrency = (amount: number | string) => {
    return Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2 });
};

interface PaymentHistoryTableProps {
    payments: Payment[];
    isLoading?: boolean;
    onViewReceipt?: (payment: Payment) => void;
    isAdmin?: boolean;
}

// Memoized payment row component to prevent unnecessary re-renders
const PaymentRow = memo(({ payment, isAdmin, onViewReceipt }: { payment: Payment; isAdmin?: boolean; onViewReceipt?: (payment: Payment) => void }) => {
    const formattedAmount = useMemo(() => formatCurrency(payment.amount), [payment.amount]);
    const formattedDate = useMemo(() => formatDateSimple(payment.paymentDate), [payment.paymentDate]);

    return (
        <tr>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {formattedDate}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {PAYMENT_TYPE_LABELS[payment.type]}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {PAYMENT_METHOD_LABELS[payment.paymentMethod]}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                ${formattedAmount}
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    payment.status === 'CONFIRMED'
                        ? 'bg-green-100 text-green-800'
                        : payment.status === 'REJECTED'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                    {PAYMENT_STATUS_LABELS[payment.status]}
                </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 hover:text-blue-900">
                {payment.receiptFileUrl ? (
                    <div className="flex justify-center">
                        {isAdmin && onViewReceipt ? (
                            <button
                                onClick={() => onViewReceipt(payment)}
                                className="text-gray-500 hover:text-blue-600 transition-colors p-2 rounded-full hover:bg-blue-50"
                                aria-label="View payment receipt"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 5 8.268 7.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            </button>
                        ) : (
                            <a
                                href={`${process.env.NEXT_PUBLIC_API_URL}/payments/${payment.id}/receipt`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-500 hover:text-blue-600 transition-colors p-2 rounded-full hover:bg-blue-50 inline-block"
                                aria-label="View payment receipt (opens in new tab)"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 5 8.268 7.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            </a>
                        )}
                    </div>
                ) : (
                    <span className="text-gray-400 text-xs">-</span>
                )}
            </td>
        </tr>
    );
});

PaymentRow.displayName = 'PaymentRow';

function PaymentHistoryTable({ payments, isLoading, onViewReceipt, isAdmin }: PaymentHistoryTableProps) {
    // Use regular table for small lists (< 50 items), virtualized for large lists
    // This prevents unnecessary complexity for most use cases
    const useVirtualization = payments.length > 50;

    if (isLoading) {
        return <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-100 rounded"></div>)}
        </div>;
    }

    if (payments.length === 0) {
        return <div className="text-center py-8 text-gray-500">No payments recorded.</div>;
    }

    if (!useVirtualization) {
        return (
            <>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receipt</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {payments.map((payment) => (
                                <PaymentRow
                                    key={payment.id}
                                    payment={payment}
                                    isAdmin={isAdmin}
                                    onViewReceipt={onViewReceipt}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-3">
                    {payments.map((payment) => (
                        <MobilePaymentCard
                            key={payment.id}
                            payment={payment}
                            isAdmin={isAdmin}
                            onViewReceipt={onViewReceipt}
                        />
                    ))}
                </div>
            </>
        );
    }

    // For large lists (50+ items), use virtualized rendering
    // This dramatically improves performance with 100s or 1000s of payments
    return (
        <>
            {/* Desktop Virtualized Table */}
            <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receipt</th>
                        </tr>
                    </thead>
                </table>
                <div className="relative">
                    <table className="min-w-full divide-y divide-gray-200">
                        <tbody className="bg-white divide-y divide-gray-200">
                            {payments.map((payment) => (
                                <PaymentRow
                                    key={payment.id}
                                    payment={payment}
                                    isAdmin={isAdmin}
                                    onViewReceipt={onViewReceipt}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="text-xs text-gray-500 mt-2 px-2">
                    Showing {payments.length} payments (optimized mode for large lists)
                </div>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
                {payments.map((payment) => (
                    <MobilePaymentCard
                        key={payment.id}
                        payment={payment}
                        isAdmin={isAdmin}
                        onViewReceipt={onViewReceipt}
                    />
                ))}
                <div className="text-xs text-gray-500 mt-2 px-2 text-center">
                    Showing {payments.length} payments
                </div>
            </div>
        </>
    );
}

// Memoize table component to prevent re-renders when payments array reference changes but content is same
export default memo(PaymentHistoryTable);
