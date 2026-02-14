'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { InvoicesService } from '@/services/invoices.service';
import { ProjectsService } from '@/services/projects.service';
import { CreateInvoiceDto } from '@/types/invoice';
import { logger } from '@/lib/logger';
import { handleApiError } from '@/lib/errors';
import { toast } from 'react-hot-toast';

interface GenerateInvoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    onSuccess: () => void;
}

interface GenerateInvoiceFormValues {
    amount: string;
    dueDate: string;
    description: string;
}

export default function GenerateInvoiceModal({
    isOpen,
    onClose,
    projectId,
    onSuccess,
}: GenerateInvoiceModalProps) {
    const [hasUnpaid, setHasUnpaid] = useState(false);
    const [checkingUnpaid, setCheckingUnpaid] = useState(true);
    const [clientId, setClientId] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting }
    } = useForm<GenerateInvoiceFormValues>({
        defaultValues: {
            amount: '',
            dueDate: '',
            description: ''
        }
    });

    // Check for unpaid invoices when modal opens
    useEffect(() => {
        if (isOpen) {
            checkForUnpaidInvoices();
        }
    }, [isOpen, projectId]);

    const checkForUnpaidInvoices = async () => {
        try {
            setCheckingUnpaid(true);
            const [unpaid, project] = await Promise.all([
                InvoicesService.hasUnpaidInvoices(projectId),
                ProjectsService.getById(projectId)
            ]);
            setHasUnpaid(unpaid);
            if (project?.clientId) {
                setClientId(project.clientId);
            }
        } catch (err) {
            logger.error('Failed to check unpaid invoices', err, { projectId });
            toast.error('Failed to load project details');
        } finally {
            setCheckingUnpaid(false);
        }
    };

    const onSubmit = async (data: GenerateInvoiceFormValues) => {
        try {
            if (!clientId) {
                toast.error('Client ID not found for this project');
                return;
            }

            const issueDate = new Date(); // Current date as issue date
            const due = new Date(data.dueDate);
            const diffTime = Math.abs(due.getTime() - issueDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            const payload = {
                projectId,
                clientId,
                issueDate: issueDate.toISOString(),
                dueDate: due.toISOString(),
                paymentTermsDays: diffDays > 0 ? diffDays : 0,
                subtotal: Number(data.amount),
                totalAmount: Number(data.amount),
                notes: data.description || undefined,
            };

            await InvoicesService.create(payload as any);
            toast.success('Invoice created successfully');
            await onSuccess();
            handleClose();
        } catch (err: any) {
            logger.error('Failed to create invoice', err, { projectId, amount: data.amount });
            toast.error(handleApiError(err, 'Failed to create invoice'));
        }
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 bg-black/50 backdrop-blur-sm sm:p-4">
            <div className="w-full max-w-md overflow-hidden bg-white shadow-xl rounded-xl">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200 bg-stone-50 sm:px-6 sm:py-4">
                    <h3 className="text-base font-semibold text-navy-900 sm:text-lg">Generate Invoice</h3>
                    <button
                        onClick={handleClose}
                        className="text-stone-400 transition-colors hover:text-stone-600"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4 sm:p-6">
                    {checkingUnpaid ? (
                        <div className="flex justify-center items-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-800"></div>
                        </div>
                    ) : hasUnpaid ? (
                        <div className="p-4 bg-amber-50 border border-amber-300 rounded-lg">
                            <div className="flex items-start gap-3">
                                <svg className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <div className="flex-1">
                                    <h4 className="font-semibold text-amber-900 mb-2">Cannot Generate New Invoice</h4>
                                    <p className="text-sm text-amber-800 mb-3">
                                        There are still unpaid invoices for this project. Please ensure all previous invoices are fully paid before generating a new one.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={handleClose}
                                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-colors text-sm"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-1">
                                    Total Amount (MXN)
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2 text-stone-500">$</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        {...register('amount', { required: 'Amount is required' })}
                                        className={`w-full pl-7 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-navy-900 focus:border-transparent outline-none transition-all ${errors.amount ? 'border-red-300' : 'border-stone-300'}`}
                                        placeholder="0.00"
                                    />
                                </div>
                                {errors.amount && <p className="text-xs text-red-600 mt-1">{errors.amount.message}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-1">
                                    Due Date
                                </label>
                                <input
                                    type="date"
                                    {...register('dueDate', { required: 'Due date is required' })}
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-navy-900 focus:border-transparent outline-none transition-all ${errors.dueDate ? 'border-red-300' : 'border-stone-300'}`}
                                />
                                {errors.dueDate && <p className="text-xs text-red-600 mt-1">{errors.dueDate.message}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-1">
                                    Description / Concept
                                </label>
                                <textarea
                                    rows={3}
                                    {...register('description')}
                                    className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-navy-900 focus:border-transparent outline-none transition-all"
                                    placeholder="e.g. Web Development Phase 1..."
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col gap-2 pt-4 sm:flex-row sm:gap-3">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="flex-1 px-4 py-2 font-medium text-stone-700 transition-colors bg-stone-100 rounded-lg hover:bg-stone-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex items-center justify-center flex-1 gap-2 px-4 py-2 font-medium text-white transition-colors bg-navy-900 rounded-lg hover:bg-navy-800 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            <span>Saving...</span>
                                        </>
                                    ) : (
                                        'Generate Invoice'
                                    )}
                                </button>
                            </div>
                        </>
                    )}
                </form>
            </div>
        </div>
    );
}
