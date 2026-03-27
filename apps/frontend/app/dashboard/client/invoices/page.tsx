'use client';

import InvoiceStatusBadge from '@/components/dashboard/invoices/InvoiceStatusBadge';
import { formatCurrency } from '@/lib/utils/currency.utils';
import { formatDate } from '@/lib/utils/date.utils';
import { useAuth } from '@/contexts/AuthContext';
import { useInvoicesListQuery } from '@/hooks/queries';

export default function ClientInvoicesPage() {
    const { user } = useAuth();

    // TanStack Query: fetch invoices filtered by client ID
    const filters = user?.role === 'CLIENT' ? { clientId: user.id } : {};
    const { data: invoices = [], isLoading } = useInvoicesListQuery(filters, {
        enabled: !!user,
    });

    if (isLoading) return <div>Loading invoices...</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-[#1B1C1A]">My Invoices</h1>

            {/* Desktop Table View */}
            <div className="hidden md:block bg-white overflow-hidden sm:rounded-lg">
                <table className="min-w-full divide-y divide-[#D0C5B2]/15">
                    <thead className="bg-[#F5F4F0]">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-[#6B6A65] uppercase tracking-wider">Number</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-[#6B6A65] uppercase tracking-wider">Project</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-[#6B6A65] uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-[#6B6A65] uppercase tracking-wider">Amount</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-[#6B6A65] uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-right"></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-[#D0C5B2]/15">
                        {invoices.map((invoice) => (
                            <tr key={invoice.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#C9A84C]">
                                    {invoice.invoiceNumber}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-[#6B6A65]">
                                    {invoice.project?.name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {formatDate(invoice.issueDate)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-[#1B1C1A] font-bold">
                                    {formatCurrency(invoice.totalAmount)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <InvoiceStatusBadge status={invoice.status} />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <span className="text-[#6B6A65]">Download</span>
                                </td>
                            </tr>
                        ))}
                        {invoices.length === 0 && (
                            <tr><td colSpan={6} className="px-6 py-4 text-center text-[#6B6A65]">No invoices yet</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
                {invoices.length === 0 ? (
                    <div className="bg-white rounded-lg p-6 text-center text-[#6B6A65]">
                        No invoices yet
                    </div>
                ) : (
                    invoices.map((invoice) => (
                        <div key={invoice.id} className="bg-white rounded-lg p-4">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <div className="text-sm font-medium text-[#C9A84C]">
                                        {invoice.invoiceNumber}
                                    </div>
                                    <div className="text-xs text-[#6B6A65] mt-1">
                                        {invoice.project?.name}
                                    </div>
                                </div>
                                <InvoiceStatusBadge status={invoice.status} />
                            </div>
                            <div className="space-y-2 text-sm mb-3">
                                <div className="flex justify-between">
                                    <span className="text-[#6B6A65]">Date:</span>
                                    <span className="text-[#6B6A65]">{formatDate(invoice.issueDate)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[#6B6A65]">Amount:</span>
                                    <span className="text-[#1B1C1A] font-bold">{formatCurrency(invoice.totalAmount)}</span>
                                </div>
                            </div>
                            <button className="w-full px-4 py-2 text-sm text-[#6B6A65] bg-[#F5F4F0] rounded-lg cursor-not-allowed">
                                Download
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
