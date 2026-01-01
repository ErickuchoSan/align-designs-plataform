'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { UsersService } from '@/services/users.service';
import { InvoicesService } from '@/services/invoices.service';
import { ProjectsService } from '@/services/projects.service';
import { User, Project } from '@/types';
import { Invoice } from '@/services/invoices.service';
import { formatCurrency } from '@/lib/utils/currency.utils';
import { formatDate } from '@/lib/utils/date.utils';
import InvoiceStatusBadge from '@/components/dashboard/invoices/InvoiceStatusBadge';
import Link from 'next/link';

export default function ClientProfilePage() {
    const params = useParams();
    const id = params?.id as string;

    const [client, setClient] = useState<User | null>(null);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            loadData();
        }
    }, [id]);

    async function loadData() {
        try {
            const [clientData, invoicesData, projectsData] = await Promise.all([
                UsersService.getById(id),
                InvoicesService.getAll({ clientId: id }),
                ProjectsService.getAll({ clientId: id }) // Assuming filter support
            ]);

            setClient(clientData);
            setInvoices(invoicesData);
            // setProjects(projectsData.projects); // ProjectsService.getAll returns { projects, total } logic might vary
            // Assuming for now it returns just array or we extract it
            if ('projects' in projectsData && Array.isArray((projectsData as any).projects)) {
                setProjects((projectsData as any).projects);
            } else if (Array.isArray(projectsData)) {
                setProjects(projectsData);
            }

        } catch (error) {
            console.error('Failed to load client data', error);
        } finally {
            setLoading(false);
        }
    }

    if (loading) return <div>Loading...</div>;
    if (!client) return <div>Client not found</div>;

    const totalBilled = invoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
    const totalPaid = invoices.reduce((sum, inv) => sum + Number(inv.amountPaid), 0);
    const outstanding = totalBilled - totalPaid;

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
        </div>
    );
}
