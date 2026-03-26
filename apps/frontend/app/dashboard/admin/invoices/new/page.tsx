'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createInvoiceSchema, CreateInvoiceFormData } from '@/lib/schemas/invoice.schema';
import { InvoicesService } from '@/services/invoices.service';
import { toast } from '@/lib/toast';
import { handleApiError } from '@/lib/errors';
import { ButtonLoader } from '@/components/ui/Loader';
import { getTodayDateString, formatDateForInput } from '@/lib/date.utils';
import { cn, INPUT_BASE, INPUT_VARIANTS, TEXTAREA_BASE, BUTTON_BASE, BUTTON_VARIANTS, BUTTON_SIZES } from '@/lib/styles';
import { useProjectsListQuery } from '@/hooks/queries';

export default function CreateInvoicePage() {
    const router = useRouter();

    // TanStack Query: fetch projects
    const { data: projectsData, isLoading: loadingProjects } = useProjectsListQuery({ limit: 100 });
    const projects = useMemo(() => projectsData?.projects || [], [projectsData?.projects]);

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors, isSubmitting }
    } = useForm<CreateInvoiceFormData>({
        resolver: zodResolver(createInvoiceSchema) as Resolver<CreateInvoiceFormData>,
        defaultValues: {
            projectId: '',
            clientId: '',
            issueDate: getTodayDateString(),
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
        return formatDateForInput(issue);
    })();

    // Derived total for display
    const totalAmount = (() => {
        const sub = Number(subtotal) || 0;
        const tax = sub * ((Number(taxRate) || 0) / 100);
        return sub + tax;
    })();

    // Effect to update clientId when project changes
    useEffect(() => {
        if (projectId) {
            const project = projects.find(p => p.id === projectId);
            if (project?.clientId) {
                setValue('clientId', project.clientId);
            }
        }
    }, [projectId, projects, setValue]);

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
                dueDate: formatDateForInput(due),
                paymentTermsDays: Number(data.paymentTermsDays),
                subtotal: sub,
                taxAmount: tax,
                totalAmount: total,
                notes: data.notes,
            });

            toast.success('Invoice created successfully');
            router.push('/dashboard/admin/invoices');
        } catch (error) {
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
                    <label htmlFor="projectId" className="block text-sm font-medium text-gray-700">Project</label>
                    <select
                        id="projectId"
                        {...register('projectId')}
                        className={cn(INPUT_BASE, errors.projectId ? INPUT_VARIANTS.error : INPUT_VARIANTS.default, 'mt-1')}
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
                        <label htmlFor="issueDate" className="block text-sm font-medium text-gray-700">Issue Date</label>
                        <input
                            id="issueDate"
                            type="date"
                            {...register('issueDate')}
                            className={cn(INPUT_BASE, INPUT_VARIANTS.default, 'mt-1')}
                        />
                        {errors.issueDate && <p className="mt-1 text-sm text-red-600">{errors.issueDate.message}</p>}
                    </div>
                    <div>
                        <label htmlFor="paymentTermsDays" className="block text-sm font-medium text-gray-700">Terms (Days)</label>
                        <input
                            id="paymentTermsDays"
                            type="number"
                            {...register('paymentTermsDays', { valueAsNumber: true })}
                            className={cn(INPUT_BASE, INPUT_VARIANTS.default, 'mt-1')}
                            min="0"
                        />
                        {errors.paymentTermsDays && <p className="mt-1 text-sm text-red-600">{errors.paymentTermsDays.message}</p>}
                    </div>
                    <div>
                        <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">Due Date</label>
                        <input
                            id="dueDate"
                            type="date"
                            value={dueDate}
                            readOnly
                            className={cn(INPUT_BASE, INPUT_VARIANTS.default, 'mt-1 bg-gray-50 text-gray-500')}
                        />
                    </div>
                </div>

                <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Financials</h3>
                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                        <div>
                            <label htmlFor="subtotal" className="block text-sm font-medium text-gray-700">Subtotal ($)</label>
                            <input
                                id="subtotal"
                                type="number"
                                step="0.01"
                                {...register('subtotal', { valueAsNumber: true })}
                                className={cn(INPUT_BASE, INPUT_VARIANTS.default, 'mt-1')}
                            />
                            {errors.subtotal && <p className="mt-1 text-sm text-red-600">{errors.subtotal.message}</p>}
                        </div>
                        <div>
                            <label htmlFor="taxRate" className="block text-sm font-medium text-gray-700">Tax Rate (%)</label>
                            <input
                                id="taxRate"
                                type="number"
                                step="0.1"
                                {...register('taxRate', { valueAsNumber: true })}
                                className={cn(INPUT_BASE, INPUT_VARIANTS.default, 'mt-1')}
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
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes (Visible to Client)</label>
                    <textarea
                        id="notes"
                        rows={3}
                        {...register('notes')}
                        className={cn(TEXTAREA_BASE, INPUT_VARIANTS.default, 'mt-1')}
                    />
                </div>

                <div className="flex justify-end space-x-3 pt-6">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className={cn(BUTTON_BASE, BUTTON_VARIANTS.ghost, BUTTON_SIZES.md, 'border border-gray-300 shadow-sm')}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className={cn(BUTTON_BASE, BUTTON_VARIANTS.primary, BUTTON_SIZES.md, 'bg-navy-600 hover:bg-navy-700 shadow-sm')}
                    >
                        {isSubmitting ? <ButtonLoader /> : 'Create Invoice'}
                    </button>
                </div>
            </form>
        </div>
    );
}
