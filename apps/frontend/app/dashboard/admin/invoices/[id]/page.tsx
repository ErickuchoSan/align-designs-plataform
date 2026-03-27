'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { InvoiceStatus } from '@/types/invoice';
import InvoiceStatusBadge from '@/components/dashboard/invoices/InvoiceStatusBadge';
import { formatCurrency } from '@/lib/utils/currency.utils';
import { formatDate } from '@/lib/utils/date.utils';
import { cn, BUTTON_BASE, BUTTON_VARIANTS, BUTTON_SIZES } from '@/lib/styles';
import { useInvoiceQuery, useUpdateInvoiceStatusMutation } from '@/hooks/queries';

export default function InvoiceDetailPage() {
    const params = useParams();
    const id = params?.id as string;
    const router = useRouter();

    // TanStack Query: fetch invoice details
    const { data: invoice = null, isLoading, error } = useInvoiceQuery(id, {
        enabled: !!id,
    });

    // TanStack Query: mutation for updating status
    const updateStatusMutation = useUpdateInvoiceStatusMutation();

    // Redirect on error
    useEffect(() => {
        if (error) {
            router.push('/dashboard/admin/invoices');
        }
    }, [error, router]);

    function handleStatusChange(newStatus: InvoiceStatus) {
        if (!invoice) return;
        updateStatusMutation.mutate({ invoiceId: invoice.id, status: newStatus });
    }

    if (isLoading) return <div className="p-8 text-center text-gray-500">Loading invoice details...</div>;
    if (!invoice) return <div className="p-8 text-center text-red-500">Invoice not found</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-[#1B1C1A]">{invoice.invoiceNumber}</h1>
                        <InvoiceStatusBadge status={invoice.status} />
                    </div>
                    <p className="text-sm text-[#6B6A65] mt-1">Created on {formatDate(invoice.createdAt)}</p>
                </div>
                <div className="flex gap-2">
                    {invoice.status === InvoiceStatus.DRAFT && (
                        <button
                            onClick={() => handleStatusChange(InvoiceStatus.SENT)}
                            className={cn(BUTTON_BASE, BUTTON_SIZES.md, 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500 shadow-sm')}
                        >
                            Mark as Sent
                        </button>
                    )}
                    {invoice.status === InvoiceStatus.SENT && (
                        <button
                            onClick={() => handleStatusChange(InvoiceStatus.PAID)}
                            className={cn(BUTTON_BASE, BUTTON_SIZES.md, 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500 shadow-sm')}
                        >
                            Mark as Paid
                        </button>
                    )}
                    <button
                        onClick={() => globalThis.print()}
                        className={cn(BUTTON_BASE, BUTTON_VARIANTS.ghost, BUTTON_SIZES.md, 'border border-gray-300 shadow-sm')}
                    >
                        Print / Download PDF
                    </button>
                </div>
            </div>

            {/* Invoice Document Look */}
            <div className="bg-white rounded-lg overflow-hidden">
                <div className="p-8 space-y-8">

                    {/* Top Section */}
                    <div className="flex justify-between border-b border-[#D0C5B2]/20 pb-8">
                        <div>
                            <h2 className="text-lg font-bold text-[#1B1C1A]">Align Designs</h2>
                            <p className="text-[#6B6A65]">123 Design Street</p>
                            <p className="text-[#6B6A65]">Creative City, CC 12345</p>
                            <p className="text-[#6B6A65]">billing@aligndesigns.com</p>
                        </div>
                        <div className="text-right">
                            <h3 className="text-[#6B6A65] uppercase tracking-wider text-sm font-semibold">Bill To</h3>
                            <p className="text-lg font-medium text-[#1B1C1A] mt-1">
                                {invoice.client?.firstName} {invoice.client?.lastName}
                            </p>
                            <p className="text-[#6B6A65]">{invoice.client?.email}</p>
                            {invoice.client?.phone && <p className="text-[#6B6A65]">{invoice.client.phone}</p>}
                        </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-[#F5F4F0] p-6 rounded-lg">
                        <div>
                            <p className="text-xs font-semibold text-[#6B6A65] uppercase">Issue Date</p>
                            <p className="text-[#1B1C1A] font-medium">{formatDate(invoice.issueDate)}</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-[#6B6A65] uppercase">Due Date</p>
                            <p className="text-[#1B1C1A] font-medium">{formatDate(invoice.dueDate)}</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-[#6B6A65] uppercase">Project</p>
                            <p className="text-[#1B1C1A] font-medium">{invoice.project?.name}</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-[#6B6A65] uppercase">Amount Due</p>
                            <p className="text-[#1B1C1A] font-bold">{formatCurrency(invoice.totalAmount)}</p>
                        </div>
                    </div>

                    {/* Line Items (Simplified as one main item for Phase 4) */}
                    <div>
                        {/* Desktop Table View */}
                        <table className="hidden md:table min-w-full divide-y divide-[#D0C5B2]/15">
                            <thead>
                                <tr>
                                    <th className="px-3 py-3 text-left text-xs font-medium text-[#6B6A65] uppercase tracking-wider">Description</th>
                                    <th className="px-3 py-3 text-right text-xs font-medium text-[#6B6A65] uppercase tracking-wider">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#D0C5B2]/15">
                                <tr>
                                    <td className="px-3 py-4 text-sm text-[#1B1C1A]">
                                        Professional Services for Project: <strong>{invoice.project?.name}</strong>
                                        <div className="text-[#6B6A65] text-xs mt-1">{invoice.notes}</div>
                                    </td>
                                    <td className="px-3 py-4 text-sm text-[#1B1C1A] text-right">
                                        {formatCurrency(invoice.subtotal)}
                                    </td>
                                </tr>
                            </tbody>
                        </table>

                        {/* Mobile Card View */}
                        <div className="md:hidden bg-[#F5F4F0] rounded-lg p-4">
                            <div className="text-xs font-medium text-[#6B6A65] uppercase mb-2">Description</div>
                            <div className="text-sm text-[#1B1C1A] mb-2">
                                Professional Services for Project: <strong>{invoice.project?.name}</strong>
                            </div>
                            {invoice.notes && (
                                <div className="text-[#6B6A65] text-xs mb-3">{invoice.notes}</div>
                            )}
                            <div className="flex justify-between items-center pt-3 border-t border-[#D0C5B2]/20">
                                <span className="text-xs font-medium text-[#6B6A65] uppercase">Amount</span>
                                <span className="text-sm font-medium text-[#1B1C1A]">{formatCurrency(invoice.subtotal)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Totals */}
                    <div className="flex justify-end">
                        <div className="w-full md:w-1/3 space-y-3">
                            <div className="flex justify-between text-sm text-[#6B6A65]">
                                <span>Subtotal</span>
                                <span>{formatCurrency(invoice.subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-[#6B6A65]">
                                <span>Tax</span>
                                <span>{formatCurrency(invoice.taxAmount)}</span>
                            </div>
                            <div className="flex justify-between text-base font-bold text-[#1B1C1A] border-t border-[#D0C5B2]/20 pt-3">
                                <span>Total</span>
                                <span>{formatCurrency(invoice.totalAmount)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-[#6B6A65] pt-1">
                                <span>Amount Paid</span>
                                <span className="text-green-600">-{formatCurrency(invoice.amountPaid)}</span>
                            </div>
                            <div className="flex justify-between text-base font-bold text-[#1B1C1A] border-t border-[#D0C5B2]/20 pt-3">
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
