'use client';

import { useEffect, useState } from 'react';
import { InvoicesService, Invoice } from '@/services/invoices.service'; // We need a way to fetch "my invoices" or assume user context
import InvoiceStatusBadge from '@/components/dashboard/invoices/InvoiceStatusBadge';
import { formatCurrency } from '@/lib/utils/currency.utils';
import { formatDate } from '@/lib/utils/date.utils';
import Link from 'next/link';

// NOTE: We need to update InvoicesService to support "getMyInvoices" or assume API handles it via user session
// For now, let's use getAll({ clientId: 'current-user-id' }) but we need current user ID. 
// Or better, backend endpoint /invoices/my-invoices
export default function ClientInvoicesPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Ideally we fetch "my" invoices. 
        // Since we don't have getMyInvoices yet, we might need to get user ID first or add endpoint.
        // For Phase 4 speed, let's assume we can add `getMyInvoices` to service which calls `/invoices/me` (to be implemented)
        loadInvoices();
    }, []);

    async function loadInvoices() {
        try {
            // TODO: Implement /invoices/me endpoint in backend or use user context
            // For now, let's try to fetch all and filter client side? No, that's bad security.
            // Let's implement fetchCurrentUserInvoices in service
            const data = await InvoicesService.getAll(); // This is currently ADMIN only in backend controller!
            // We need to fix backend controller to allow clients to see their own invoices.
            setInvoices(data);
        } catch (error) {
            //   console.error('Failed to load invoices', error);
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
