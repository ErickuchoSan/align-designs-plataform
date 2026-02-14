'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createInvoiceSchema, CreateInvoiceFormData } from '@/lib/schemas/invoice.schema';
import { InvoicesService } from '@/services/invoices.service';
import { ProjectsService } from '@/services/projects.service';
import { Project, User } from '@/types';
import toast from 'react-hot-toast';
import { logger } from '@/lib/logger';
import { handleApiError } from '@/lib/errors';
import { ButtonLoader } from '@/components/ui/Loader';

export default function CreateInvoicePage() {
    const router = useRouter();
    const [loadingProjects, setLoadingProjects] = useState(true);
    const [projects, setProjects] = useState<Project[]>([]);

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors, isSubmitting }
    } = useForm<CreateInvoiceFormData>({
        resolver: zodResolver(createInvoiceSchema) as any,
        defaultValues: {
            projectId: '',
            clientId: '',
            issueDate: new Date().toISOString().split('T')[0],
            paymentTermsDays: 15,
            subtotal: 0,
            taxRate: 0,
            notes: '',
        }
    });

    const projectId = watch('projectId');
    const issueDate = watch('issueDate');
    const paymentTermsDays = watch('paymentTermsDays');
    const subtotal = watch('subtotal');
    const taxRate = watch('taxRate');

    // Derived due date for display
    const dueDate = (() => {
        if (!issueDate || paymentTermsDays === undefined) return '';
        const issue = new Date(issueDate);
        issue.setDate(issue.getDate() + Number(paymentTermsDays));
        return issue.toISOString().split('T')[0];
    })();

    // Derived total for display
    const totalAmount = (() => {
        const sub = Number(subtotal) || 0;
        const tax = sub * ((Number(taxRate) || 0) / 100);
        return sub + tax;
    })();

    useEffect(() => {
        loadProjects();
    }, []);

    // Effect to update clientId when project changes
    useEffect(() => {
        if (projectId) {
            const project = projects.find(p => p.id === projectId);
            if (project?.clientId) {
                setValue('clientId', project.clientId);
            }
        }
    }, [projectId, projects, setValue]);

    async function loadProjects() {
        try {
            setLoadingProjects(true);
            const response = await ProjectsService.getAll({ limit: 100 });
            setProjects(response.projects);
        } catch (error) {
            logger.error("Failed loading projects", error);
            toast.error("Failed to load projects");
        } finally {
            setLoadingProjects(false);
        }
    }

    const onSubmit = async (data: CreateInvoiceFormData) => {
        try {
            // Recalculate derived values for the payload
            const due = new Date(data.issueDate);
            due.setDate(due.getDate() + Number(data.paymentTermsDays));

            const sub = Number(data.subtotal);
            const tax = sub * ((Number(data.taxRate) || 0) / 100);
            const total = sub + tax;

            await InvoicesService.create({
                projectId: data.projectId,
                clientId: data.clientId,
                issueDate: data.issueDate,
                dueDate: due.toISOString().split('T')[0],
                paymentTermsDays: Number(data.paymentTermsDays),
                subtotal: sub,
                taxAmount: tax,
                totalAmount: total,
                notes: data.notes,
            });

            toast.success('Invoice created successfully');
            router.push('/dashboard/admin/invoices');
        } catch (error) {
            logger.error('Failed to create invoice', error);
            toast.error(handleApiError(error, 'Failed to create invoice'));
        }
    };

    if (loadingProjects) {
        return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-900"></div></div>;
    }

    return (
        <div className="max-w-3xl mx-auto">
            <h1 className="text-2xl font-bold text-navy-900 mb-6">Create New Invoice</h1>

            <form onSubmit={handleSubmit(onSubmit)} className="bg-white shadow rounded-lg p-6 space-y-6">

                {/* Project Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">Project</label>
                    <select
                        {...register('projectId')}
                        className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-navy-500 focus:border-navy-500 sm:text-sm rounded-md ${errors.projectId ? 'border-red-300' : ''}`}
                    >
                        <option value="">Select a project...</option>
                        {projects.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.name} (Client: {p.client?.firstName} {p.client?.lastName})
                            </option>
                        ))}
                    </select>
                    {errors.projectId && <p className="mt-1 text-sm text-red-600">{errors.projectId.message}</p>}
                </div>

                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Issue Date</label>
                        <input
                            type="date"
                            {...register('issueDate')}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-navy-500 focus:border-navy-500 sm:text-sm"
                        />
                        {errors.issueDate && <p className="mt-1 text-sm text-red-600">{errors.issueDate.message}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Terms (Days)</label>
                        <input
                            type="number"
                            {...register('paymentTermsDays', { valueAsNumber: true })}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-navy-500 focus:border-navy-500 sm:text-sm"
                            min="0"
                        />
                        {errors.paymentTermsDays && <p className="mt-1 text-sm text-red-600">{errors.paymentTermsDays.message}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Due Date</label>
                        <input
                            type="date"
                            value={dueDate}
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
                                step="0.01"
                                {...register('subtotal', { valueAsNumber: true })}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-navy-500 focus:border-navy-500 sm:text-sm"
                            />
                            {errors.subtotal && <p className="mt-1 text-sm text-red-600">{errors.subtotal.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Tax Rate (%)</label>
                            <input
                                type="number"
                                step="0.1"
                                {...register('taxRate', { valueAsNumber: true })}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-navy-500 focus:border-navy-500 sm:text-sm"
                            />
                            {errors.taxRate && <p className="mt-1 text-sm text-red-600">{errors.taxRate.message}</p>}
                        </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                        <div className="text-right">
                            <p className="text-sm text-gray-500">Total Amount</p>
                            <p className="text-2xl font-bold text-navy-900">${totalAmount.toFixed(2)}</p>
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Notes (Visible to Client)</label>
                    <textarea
                        rows={3}
                        {...register('notes')}
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
                        disabled={isSubmitting}
                        className="bg-navy-600 border border-transparent rounded-md shadow-sm py-2 px-4 inline-flex justify-center text-sm font-medium text-white hover:bg-navy-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-navy-500 disabled:opacity-50 min-w-[140px]"
                    >
                        {isSubmitting ? <ButtonLoader /> : 'Create Invoice'}
                    </button>
                </div>
            </form>
        </div>
    );
}
