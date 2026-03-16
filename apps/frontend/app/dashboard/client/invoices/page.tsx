'use client';

import { useEffect, useState } from 'react';
import { InvoicesService } from '@/services/invoices.service'; // We need a way to fetch "my invoices" or assume user context
import { Invoice } from '@/types/invoice';
import InvoiceStatusBadge from '@/components/dashboard/invoices/InvoiceStatusBadge';
import { formatCurrency } from '@/lib/utils/currency.utils';
import { formatDate } from '@/lib/utils/date.utils';

// NOTE: We need to update InvoicesService to support "getMyInvoices" or assume API handles it via user session
// For now, let's use getAll({ clientId: 'current-user-id' }) but we need current user ID. 
// Or better, backend endpoint /invoices/my-invoices
import { useAuth } from '@/contexts/AuthContext';
import { handleApiError } from '@/lib/errors';
import { toast } from '@/lib/toast';

export default function ClientInvoicesPage() {
    const { user } = useAuth();
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            loadInvoices();
        }
    }, [user]);

    async function loadInvoices() {
        try {
            // Filter by client ID if the user is a client
            const filters = user?.role === 'CLIENT' ? { clientId: user.id } : {};
            const data = await InvoicesService.getAll(filters);
            setInvoices(data);
        } catch (error) {
            toast.error(handleApiError(error, 'Failed to load invoices'));
        } finally {
            setLoading(false);
        }
    }

    if (loading) return <div>Loading invoices...</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-navy-900">My Invoices</h1>

            {/* Desktop Table View */}
            <div className="hidden md:block bg-white shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Number</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-right"></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {invoices.map((invoice) => (
                            <tr key={invoice.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-navy-600">
                                    {invoice.invoiceNumber}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {invoice.project?.name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {formatDate(invoice.issueDate)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                                    {formatCurrency(invoice.totalAmount)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <InvoiceStatusBadge status={invoice.status} />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <span className="text-gray-400">Download</span>
                                </td>
                            </tr>
                        ))}
                        {invoices.length === 0 && (
                            <tr><td colSpan={6} className="px-6 py-4 text-center text-gray-500">No invoices yet</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
                {invoices.length === 0 ? (
                    <div className="bg-white shadow border border-gray-200 rounded-lg p-6 text-center text-gray-500">
                        No invoices yet
                    </div>
                ) : (
                    invoices.map((invoice) => (
                        <div key={invoice.id} className="bg-white shadow border border-gray-200 rounded-lg p-4">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <div className="text-sm font-medium text-navy-600">
                                        {invoice.invoiceNumber}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        {invoice.project?.name}
                                    </div>
                                </div>
                                <InvoiceStatusBadge status={invoice.status} />
                            </div>
                            <div className="space-y-2 text-sm mb-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Date:</span>
                                    <span className="text-gray-700">{formatDate(invoice.issueDate)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Amount:</span>
                                    <span className="text-gray-900 font-bold">{formatCurrency(invoice.totalAmount)}</span>
                                </div>
                            </div>
                            <button className="w-full px-4 py-2 text-sm text-gray-400 bg-gray-100 rounded-lg cursor-not-allowed">
                                Download
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
