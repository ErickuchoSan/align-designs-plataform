'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { InvoicesService } from '@/services/invoices.service';
import { ProjectsService } from '@/services/projects.service';
import { UsersService } from '@/services/users.service';
import { Project, User } from '@/types';
import toast from 'react-hot-toast';

export default function CreateInvoicePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [projects, setProjects] = useState<Project[]>([]);
    const [clients, setClients] = useState<User[]>([]); // Optional: If we want to filter projects by client

    const [formData, setFormData] = useState({
        projectId: '',
        clientId: '', // Will be auto-set when project is selected
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: '',
        paymentTermsDays: 15,
        subtotal: 0,
        taxRate: 0, // Percentage
        notes: '',
    });

    useEffect(() => {
        loadProjects();
    }, []);

    useEffect(() => {
        // Auto-calculate due date when issue date or terms change
        if (formData.issueDate && formData.paymentTermsDays) {
            const issue = new Date(formData.issueDate);
            issue.setDate(issue.getDate() + Number(formData.paymentTermsDays));
            setFormData(prev => ({ ...prev, dueDate: issue.toISOString().split('T')[0] }));
        }
    }, [formData.issueDate, formData.paymentTermsDays]);

    async function loadProjects() {
        try {
            // Assuming existing service endpoint
            const response = await ProjectsService.getAll();
            setProjects(response.projects);
        } catch (error) {
            console.error("Failed loading projects");
        }
    }

    const handleProjectChange = (projectId: string) => {
        const project = projects.find(p => p.id === projectId);
        if (project) {
            setFormData(prev => ({
                ...prev,
                projectId,
                clientId: project.clientId,
            }));
        }
    };

    const calculateTotal = () => {
        const sub = Number(formData.subtotal);
        const tax = sub * (Number(formData.taxRate) / 100);
        return sub + tax;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.projectId) {
            toast.error('Please select a project');
            return;
        }

        try {
            setLoading(true);
            const totalAmount = calculateTotal();
            const taxAmount = Number(formData.subtotal) * (Number(formData.taxRate) / 100);

            await InvoicesService.create({
                projectId: formData.projectId,
                clientId: formData.clientId,
                issueDate: formData.issueDate,
                dueDate: formData.dueDate,
                paymentTermsDays: Number(formData.paymentTermsDays),
                subtotal: Number(formData.subtotal),
                taxAmount,
                totalAmount,
                notes: formData.notes,
            });

            toast.success('Invoice created successfully');
            router.push('/dashboard/admin/invoices');
        } catch (error) {
            toast.error('Failed to create invoice');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto">
            <h1 className="text-2xl font-bold text-navy-900 mb-6">Create New Invoice</h1>

            <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-6">

                {/* Project Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">Project</label>
                    <select
                        value={formData.projectId}
                        onChange={(e) => handleProjectChange(e.target.value)}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-navy-500 focus:border-navy-500 sm:text-sm rounded-md"
                        required
                    >
                        <option value="">Select a project...</option>
                        {projects.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.name} (Client: {p.client?.firstName} {p.client?.lastName})
                            </option>
                        ))}
                    </select>
                </div>

                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Issue Date</label>
                        <input
                            type="date"
                            value={formData.issueDate}
                            onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-navy-500 focus:border-navy-500 sm:text-sm"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Terms (Days)</label>
                        <input
                            type="number"
                            value={formData.paymentTermsDays}
                            onChange={(e) => setFormData({ ...formData, paymentTermsDays: Number(e.target.value) })}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-navy-500 focus:border-navy-500 sm:text-sm"
                            min="0"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Due Date</label>
                        <input
                            type="date"
                            value={formData.dueDate}
                            readOnly
                            className="mt-1 block w-full bg-gray-50 border-gray-300 rounded-md shadow-sm text-gray-500 sm:text-sm"
                        />
                    </div>
                </div>

                <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Financials</h3>
                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Subtotal ($)</label>
                            <input
                                type="number"
                                value={formData.subtotal}
                                onChange={(e) => setFormData({ ...formData, subtotal: Number(e.target.value) })}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-navy-500 focus:border-navy-500 sm:text-sm"
                                min="0"
                                step="0.01"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Tax Rate (%)</label>
                            <input
                                type="number"
                                value={formData.taxRate}
                                onChange={(e) => setFormData({ ...formData, taxRate: Number(e.target.value) })}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-navy-500 focus:border-navy-500 sm:text-sm"
                                min="0"
                                step="0.1"
                            />
                        </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                        <div className="text-right">
                            <p className="text-sm text-gray-500">Total Amount</p>
                            <p className="text-2xl font-bold text-navy-900">${calculateTotal().toFixed(2)}</p>
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Notes (Visible to Client)</label>
                    <textarea
                        rows={3}
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-navy-500 focus:border-navy-500 sm:text-sm"
                    />
                </div>

                <div className="flex justify-end space-x-3 pt-6">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-navy-500"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-navy-600 border border-transparent rounded-md shadow-sm py-2 px-4 inline-flex justify-center text-sm font-medium text-white hover:bg-navy-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-navy-500 disabled:opacity-50"
                    >
                        {loading ? 'Creating...' : 'Create Invoice'}
                    </button>
                </div>
            </form>
        </div>
    );
}
