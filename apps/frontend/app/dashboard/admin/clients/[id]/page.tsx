'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { formatCurrency } from '@/lib/utils/currency.utils';
import { formatDate } from '@/lib/utils/date.utils';
import InvoiceStatusBadge from '@/components/dashboard/invoices/InvoiceStatusBadge';
import Link from 'next/link';
import { useClientProfileDataQuery } from '@/hooks/queries';

export default function ClientProfilePage() {
    const params = useParams();
    const id = params?.id as string;

    // TanStack Query: fetch client profile data (user, invoices, projects)
    const { data, isLoading } = useClientProfileDataQuery(id, {
        enabled: !!id,
    });

    const client = data?.client || null;
    const invoices = useMemo(() => data?.invoices || [], [data?.invoices]);
    const projects = useMemo(() => data?.projects || [], [data?.projects]);

    // Compute totals
    const { totalBilled, totalPaid, outstanding } = useMemo(() => {
        const billed = invoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
        const paid = invoices.reduce((sum, inv) => sum + Number(inv.amountPaid), 0);
        return { totalBilled: billed, totalPaid: paid, outstanding: billed - paid };
    }, [invoices]);

    if (isLoading) return <div>Loading...</div>;
    if (!client) return <div>Client not found</div>;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-navy-900">{client.firstName} {client.lastName}</h1>
                    <p className="text-gray-500">{client.email}</p>
                </div>
                <Link href={`/dashboard/admin/invoices/new?clientId=${client.id}`} className="bg-navy-600 text-white px-4 py-2 rounded-md hover:bg-navy-700">
                    Create Invoice
                </Link>
            </div>

            {/* Financial Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                    <p className="text-sm font-medium text-gray-500">Total Billed</p>
                    <p className="text-2xl font-bold text-navy-900">{formatCurrency(totalBilled)}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                    <p className="text-sm font-medium text-gray-500">Total Paid</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                    <p className="text-sm font-medium text-gray-500">Outstanding</p>
                    <p className="text-2xl font-bold text-red-600">{formatCurrency(outstanding)}</p>
                </div>
            </div>

            {/* Projects */}
            <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <h3 className="text-lg font-medium text-gray-900">Projects History</h3>
                </div>
                <ul className="divide-y divide-gray-200">
                    {projects.map(project => (
                        <li key={project.id} className="px-6 py-4 hover:bg-gray-50">
                            <Link href={`/dashboard/projects/${project.id}`} className="block">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-navy-600">{project.name}</p>
                                        <p className="text-xs text-gray-500">Created: {formatDate(project.createdAt)}</p>
                                    </div>
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                        {project.status}
                                    </span>
                                </div>
                            </Link>
                        </li>
                    ))}
                    {projects.length === 0 && <li className="px-6 py-4 text-center text-gray-500">No projects found</li>}
                </ul>
            </div>

            {/* Invoices */}
            <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <h3 className="text-lg font-medium text-gray-900">Invoices</h3>
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Number</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {invoices.map(invoice => (
                                <tr key={invoice.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-sm font-medium text-navy-600">
                                        <Link href={`/dashboard/admin/invoices/${invoice.id}`}>{invoice.invoiceNumber}</Link>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{formatDate(invoice.issueDate)}</td>
                                    <td className="px-6 py-4 text-sm text-gray-900">{formatCurrency(invoice.totalAmount)}</td>
                                    <td className="px-6 py-4"><InvoiceStatusBadge status={invoice.status} /></td>
                                </tr>
                            ))}
                            {invoices.length === 0 && (
                                <tr><td colSpan={4} className="px-6 py-4 text-center text-gray-500">No invoices found</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden divide-y divide-gray-200">
                    {invoices.length === 0 ? (
                        <div className="px-6 py-8 text-center text-gray-500">No invoices found</div>
                    ) : (
                        invoices.map(invoice => (
                            <Link key={invoice.id} href={`/dashboard/admin/invoices/${invoice.id}`}>
                                <div className="px-6 py-4 hover:bg-gray-50 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="text-sm font-medium text-navy-600">
                                            {invoice.invoiceNumber}
                                        </div>
                                        <InvoiceStatusBadge status={invoice.status} />
                                    </div>
                                    <div className="space-y-1 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Date:</span>
                                            <span className="text-gray-700">{formatDate(invoice.issueDate)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Amount:</span>
                                            <span className="text-gray-900 font-medium">{formatCurrency(invoice.totalAmount)}</span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
