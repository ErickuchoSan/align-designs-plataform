'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { InvoicesService } from '@/services/invoices.service';
import { Invoice } from '@/types/invoice';
import InvoiceStatusBadge from '@/components/dashboard/invoices/InvoiceStatusBadge';
import { formatCurrency } from '@/lib/utils/currency.utils';
import { formatDate } from '@/lib/utils/date.utils';
import { handleApiError } from '@/lib/errors';
import { toast } from '@/lib/toast';

export default function InvoicesListPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadInvoices();
    }, []);

    async function loadInvoices() {
        try {
            const data = await InvoicesService.getAll();
            setInvoices(data);
        } catch (error) {
            toast.error(handleApiError(error, 'Failed to load invoices'));
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return <div className="p-8 text-center">Loading invoices...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-navy-900">Invoices</h1>
                <Link
                    href="/dashboard/admin/invoices/new"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-navy-600 hover:bg-navy-700"
                >
                    <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create Invoice
                </Link>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block bg-white shadow border border-gray-200 sm:rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Invoice #
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Client / Project
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Date
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Due Date
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Amount
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th scope="col" className="relative px-6 py-3">
                                    <span className="sr-only">View</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {invoices.map((invoice) => (
                                <tr key={invoice.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-navy-600">
                                        <Link href={`/dashboard/admin/invoices/${invoice.id}`}>
                                            {invoice.invoiceNumber}
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <div className="font-medium text-gray-900">
                                            {invoice.client?.firstName} {invoice.client?.lastName}
                                        </div>
                                        <div className="text-gray-500 text-xs">{invoice.project?.name}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {formatDate(invoice.issueDate)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {formatDate(invoice.dueDate)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                        {formatCurrency(invoice.totalAmount)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <InvoiceStatusBadge status={invoice.status} />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <Link href={`/dashboard/admin/invoices/${invoice.id}`} className="text-navy-600 hover:text-navy-900">
                                            View
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            {invoices.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
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
                    <div className="bg-white shadow border border-gray-200 rounded-lg p-6 text-center text-gray-500">
                        No invoices found. Create one to get started.
                    </div>
                ) : (
                    invoices.map((invoice) => (
                        <Link key={invoice.id} href={`/dashboard/admin/invoices/${invoice.id}`}>
                            <div className="bg-white shadow border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <div className="text-sm font-medium text-navy-600">
                                            {invoice.invoiceNumber}
                                        </div>
                                        <div className="text-sm font-medium text-gray-900 mt-1">
                                            {invoice.client?.firstName} {invoice.client?.lastName}
                                        </div>
                                        <div className="text-xs text-gray-500">{invoice.project?.name}</div>
                                    </div>
                                    <InvoiceStatusBadge status={invoice.status} />
                                </div>
                                <div className="grid grid-cols-2 gap-3 text-xs">
                                    <div>
                                        <div className="text-gray-500">Date</div>
                                        <div className="text-gray-900 font-medium">{formatDate(invoice.issueDate)}</div>
                                    </div>
                                    <div>
                                        <div className="text-gray-500">Due Date</div>
                                        <div className="text-gray-900 font-medium">{formatDate(invoice.dueDate)}</div>
                                    </div>
                                    <div className="col-span-2">
                                        <div className="text-gray-500">Amount</div>
                                        <div className="text-lg text-gray-900 font-bold">{formatCurrency(invoice.totalAmount)}</div>
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
