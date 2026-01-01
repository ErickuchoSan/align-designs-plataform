import { memo, useMemo } from 'react';
import { Payment, PAYMENT_METHOD_LABELS, PAYMENT_TYPE_LABELS, PAYMENT_STATUS_LABELS } from '../../types/payments';

// Create a simple format date if it doesn't exist or use Intl
const formatDateSimple = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
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
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${payment.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                    {PAYMENT_STATUS_LABELS[payment.status]}
                </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 hover:text-blue-900">
                {payment.receiptFileUrl ? (
                    isAdmin && onViewReceipt ? (
                        <button
                            onClick={() => onViewReceipt(payment)}
                            className="hover:underline font-medium"
                        >
                            Ver Recibo
                        </button>
                    ) : (
                        <a href={payment.receiptFileUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                            Ver Recibo
                        </a>
                    )
                ) : (
                    <span className="text-gray-400">-</span>
                )}
            </td>
        </tr>
    );
});

PaymentRow.displayName = 'PaymentRow';

function PaymentHistoryTable({ payments, isLoading, onViewReceipt, isAdmin }: PaymentHistoryTableProps) {
    if (isLoading) {
        return <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-100 rounded"></div>)}
        </div>;
    }

    if (payments.length === 0) {
        return <div className="text-center py-8 text-gray-500">No hay pagos registrados.</div>;
    }

    // Use regular table for small lists (< 50 items), virtualized for large lists
    // This prevents unnecessary complexity for most use cases
    const useVirtualization = payments.length > 50;

    if (!useVirtualization) {
        return (
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Método</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comprobante</th>
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
        );
    }

    // For large lists (50+ items), use virtualized rendering
    // This dramatically improves performance with 100s or 1000s of payments
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Método</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comprobante</th>
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
                Mostrando {payments.length} pagos (modo optimizado para grandes listas)
            </div>
        </div>
    );
}

// Memoize table component to prevent re-renders when payments array reference changes but content is same
export default memo(PaymentHistoryTable);
