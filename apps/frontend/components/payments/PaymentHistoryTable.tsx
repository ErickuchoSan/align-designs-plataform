import { Payment, PAYMENT_METHOD_LABELS, PAYMENT_TYPE_LABELS, PAYMENT_STATUS_LABELS } from '../../types/payments';

// Create a simple format date if it doesn't exist or use Intl
const formatDateSimple = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};

interface PaymentHistoryTableProps {
    payments: Payment[];
    isLoading?: boolean;
}

export function PaymentHistoryTable({ payments, isLoading }: PaymentHistoryTableProps) {
    if (isLoading) {
        return <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-100 rounded"></div>)}
        </div>;
    }

    if (payments.length === 0) {
        return <div className="text-center py-8 text-gray-500">No hay pagos registrados.</div>;
    }

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
                        <tr key={payment.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {formatDateSimple(payment.paymentDate)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {PAYMENT_TYPE_LABELS[payment.type]}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {PAYMENT_METHOD_LABELS[payment.paymentMethod]}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                ${Number(payment.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${payment.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                    {PAYMENT_STATUS_LABELS[payment.status]}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 hover:text-blue-900">
                                {payment.receiptFileUrl ? (
                                    <a href={payment.receiptFileUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                        Ver Recibo
                                    </a>
                                ) : (
                                    <span className="text-gray-400">-</span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
