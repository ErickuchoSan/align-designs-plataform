'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // Correct import for App Router
import { useParams } from 'next/navigation'; // Correct hook for App Router params
import { InvoicesService, Invoice, InvoiceStatus } from '@/services/invoices.service';
import InvoiceStatusBadge from '@/components/dashboard/invoices/InvoiceStatusBadge';
import { formatCurrency } from '@/lib/utils/currency.utils';
import { formatDate } from '@/lib/utils/date.utils';
import toast from 'react-hot-toast';

export default function InvoiceDetailPage() {
    const params = useParams(); // returns { id: string } | null
    const id = params?.id as string;
    const router = useRouter();

    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            loadInvoice(id);
        }
    }, [id]);

    async function loadInvoice(invoiceId: string) {
        try {
            setLoading(true);
            const data = await InvoicesService.getOne(invoiceId);
            setInvoice(data);
        } catch (error) {
            console.error('Failed to load invoice', error);
            toast.error('Could not load invoice details');
            router.push('/dashboard/admin/invoices');
        } finally {
            setLoading(false);
        }
    }

    async function handleStatusChange(newStatus: InvoiceStatus) {
        if (!invoice) return;
        try {
            const updated = await InvoicesService.updateStatus(invoice.id, newStatus);
            setInvoice(updated);
            toast.success(`Invoice marked as ${newStatus}`);
        } catch (error) {
            toast.error('Failed to update status');
        }
    }

    if (loading) return <div className="p-8 text-center text-gray-500">Loading invoice details...</div>;
    if (!invoice) return <div className="p-8 text-center text-red-500">Invoice not found</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-navy-900">{invoice.invoiceNumber}</h1>
                        <InvoiceStatusBadge status={invoice.status} />
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Created on {formatDate(invoice.createdAt)}</p>
                </div>
                <div className="flex gap-2">
                    {invoice.status === InvoiceStatus.DRAFT && (
                        <button
                            onClick={() => handleStatusChange(InvoiceStatus.SENT)}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Mark as Sent
                        </button>
                    )}
                    {invoice.status === InvoiceStatus.SENT && (
                        <button
                            onClick={() => handleStatusChange(InvoiceStatus.PAID)}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                            Mark as Paid
                        </button>
                    )}
                    <button
                        onClick={() => window.print()}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-navy-500"
                    >
                        Print / Download PDF
                    </button>
                </div>
            </div>

            {/* Invoice Document Look */}
            <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200">
                <div className="p-8 space-y-8">

                    {/* Top Section */}
                    <div className="flex justify-between border-b border-gray-200 pb-8">
                        <div>
                            <h2 className="text-lg font-bold text-navy-900">Align Designs</h2>
                            <p className="text-gray-500">123 Design Street</p>
                            <p className="text-gray-500">Creative City, CC 12345</p>
                            <p className="text-gray-500">billing@aligndesigns.com</p>
                        </div>
                        <div className="text-right">
                            <h3 className="text-gray-500 uppercase tracking-wider text-sm font-semibold">Bill To</h3>
                            <p className="text-lg font-medium text-gray-900 mt-1">
                                {invoice.client?.firstName} {invoice.client?.lastName}
                            </p>
                            <p className="text-gray-500">{invoice.client?.email}</p>
                            {invoice.client?.phone && <p className="text-gray-500">{invoice.client.phone}</p>}
                        </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-gray-50 p-6 rounded-lg">
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase">Issue Date</p>
                            <p className="text-gray-900 font-medium">{formatDate(invoice.issueDate)}</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase">Due Date</p>
                            <p className="text-gray-900 font-medium">{formatDate(invoice.dueDate)}</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase">Project</p>
                            <p className="text-gray-900 font-medium">{invoice.project?.name}</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase">Amount Due</p>
                            <p className="text-gray-900 font-bold">{formatCurrency(invoice.totalAmount)}</p>
                        </div>
                    </div>

                    {/* Line Items (Simplified as one main item for Phase 4) */}
                    <div>
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead>
                                <tr>
                                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                    <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                <tr>
                                    <td className="px-3 py-4 text-sm text-gray-900">
                                        Professional Services for Project: <strong>{invoice.project?.name}</strong>
                                        <div className="text-gray-500 text-xs mt-1">{invoice.notes}</div>
                                    </td>
                                    <td className="px-3 py-4 text-sm text-gray-900 text-right">
                                        {formatCurrency(invoice.subtotal)}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Totals */}
                    <div className="flex justify-end">
                        <div className="w-full md:w-1/3 space-y-3">
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>Subtotal</span>
                                <span>{formatCurrency(invoice.subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>Tax</span>
                                <span>{formatCurrency(invoice.taxAmount)}</span>
                            </div>
                            <div className="flex justify-between text-base font-bold text-navy-900 border-t border-gray-200 pt-3">
                                <span>Total</span>
                                <span>{formatCurrency(invoice.totalAmount)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-600 pt-1">
                                <span>Amount Paid</span>
                                <span className="text-green-600">-{formatCurrency(invoice.amountPaid)}</span>
                            </div>
                            <div className="flex justify-between text-base font-bold text-navy-900 border-t border-gray-200 pt-3">
                                <span>Balance Due</span>
                                <span>{formatCurrency(invoice.totalAmount - invoice.amountPaid)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
