'use client';

import Link from 'next/link';
import InvoiceStatusBadge from '@/components/dashboard/invoices/InvoiceStatusBadge';
import { formatCurrency } from '@/lib/utils/currency.utils';
import { formatDate } from '@/lib/utils/date.utils';
import { useInvoicesListQuery } from '@/hooks/queries';

export default function InvoicesListPage() {
    // TanStack Query: fetch all invoices
    const { data: invoices = [], isLoading } = useInvoicesListQuery();

    if (isLoading) {
        return <div className="p-8 text-center">Loading invoices...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-[#1B1C1A]">Invoices</h1>
                <Link
                    href="/dashboard/admin/invoices/new"
                    className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-gradient-to-br from-[#755B00] to-[#C9A84C] hover:brightness-95 transition-all"
                >
                    <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create Invoice
                </Link>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block bg-white rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-[#D0C5B2]/20">
                        <thead className="bg-[#F5F4F0]">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#1B1C1A] uppercase tracking-wider">
                                    Invoice #
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#1B1C1A] uppercase tracking-wider">
                                    Client / Project
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#1B1C1A] uppercase tracking-wider">
                                    Date
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#1B1C1A] uppercase tracking-wider">
                                    Due Date
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#1B1C1A] uppercase tracking-wider">
                                    Amount
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#1B1C1A] uppercase tracking-wider">
                                    Status
                                </th>
                                <th scope="col" className="relative px-6 py-3">
                                    <span className="sr-only">View</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-[#D0C5B2]/20">
                            {invoices.map((invoice) => (
                                <tr key={invoice.id} className="hover:bg-[#F5F4F0]">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#C9A84C]">
                                        <Link href={`/dashboard/admin/invoices/${invoice.id}`}>
                                            {invoice.invoiceNumber}
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#6B6A65]">
                                        <div className="font-medium text-[#1B1C1A]">
                                            {invoice.client?.firstName} {invoice.client?.lastName}
                                        </div>
                                        <div className="text-[#6B6A65] text-xs">{invoice.project?.name}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#6B6A65]">
                                        {formatDate(invoice.issueDate)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#6B6A65]">
                                        {formatDate(invoice.dueDate)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#1B1C1A] font-medium">
                                        {formatCurrency(invoice.totalAmount)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <InvoiceStatusBadge status={invoice.status} />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <Link href={`/dashboard/admin/invoices/${invoice.id}`} className="text-[#C9A84C] hover:text-[#755B00]">
                                            View
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            {invoices.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-[#6B6A65]">
                                        No invoices found. Create one to get started.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
                {invoices.length === 0 ? (
                    <div className="bg-white rounded-2xl p-6 text-center text-[#6B6A65]">
                        No invoices found. Create one to get started.
                    </div>
                ) : (
                    invoices.map((invoice) => (
                        <Link key={invoice.id} href={`/dashboard/admin/invoices/${invoice.id}`}>
                            <div className="bg-white rounded-2xl p-4 hover:bg-[#F5F4F0] transition-colors">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <div className="text-sm font-medium text-[#C9A84C]">
                                            {invoice.invoiceNumber}
                                        </div>
                                        <div className="text-sm font-medium text-[#1B1C1A] mt-1">
                                            {invoice.client?.firstName} {invoice.client?.lastName}
                                        </div>
                                        <div className="text-xs text-[#6B6A65]">{invoice.project?.name}</div>
                                    </div>
                                    <InvoiceStatusBadge status={invoice.status} />
                                </div>
                                <div className="grid grid-cols-2 gap-3 text-xs">
                                    <div>
                                        <div className="text-[#6B6A65]">Date</div>
                                        <div className="text-[#1B1C1A] font-medium">{formatDate(invoice.issueDate)}</div>
                                    </div>
                                    <div>
                                        <div className="text-[#6B6A65]">Due Date</div>
                                        <div className="text-[#1B1C1A] font-medium">{formatDate(invoice.dueDate)}</div>
                                    </div>
                                    <div className="col-span-2">
                                        <div className="text-[#6B6A65]">Amount</div>
                                        <div className="text-lg text-[#1B1C1A] font-bold">{formatCurrency(invoice.totalAmount)}</div>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))
                )}
            </div>
        </div>
    );
}
