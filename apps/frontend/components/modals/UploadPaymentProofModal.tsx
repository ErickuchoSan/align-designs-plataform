'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { InvoicesService } from '@/services/invoices.service';
import { PaymentsService } from '@/services/payments.service';
import { Invoice } from '@/types/invoice';
import { logger } from '@/lib/logger';
import { toast } from 'react-hot-toast';

interface UploadPaymentProofModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    onSuccess: () => void;
    userId: string;
}

interface UploadPaymentProofFormValues {
    invoiceId: string;
    amount: string;
    paymentDate: string;
    paymentMethod: string;
    referenceNumber: string;
}

export default function UploadPaymentProofModal({
    isOpen,
    onClose,
    projectId,
    onSuccess,
    userId,
}: UploadPaymentProofModalProps) {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loadingInvoices, setLoadingInvoices] = useState(false);
    const [file, setFile] = useState<File | null>(null);

    const {
        register,
        handleSubmit,
        setValue,
        reset,
        watch,
        formState: { errors, isSubmitting }
    } = useForm<UploadPaymentProofFormValues>({
        defaultValues: {
            invoiceId: '',
            amount: '',
            paymentDate: new Date().toISOString().split('T')[0],
            paymentMethod: 'TRANSFER',
            referenceNumber: ''
        }
    });

    const selectedInvoiceId = watch('invoiceId');

    useEffect(() => {
        if (isOpen) {
            fetchPendingInvoices();
        }
    }, [isOpen]);

    const fetchPendingInvoices = async () => {
        try {
            setLoadingInvoices(true);
            const allInvoices = await InvoicesService.getByProject(projectId);
            const pendingInvoices = allInvoices.filter(inv => inv.status !== 'PAID' && inv.status !== 'CANCELLED');
            setInvoices(pendingInvoices);
        } catch (err) {
            logger.error('Error fetching invoices:', err);
            toast.error('Failed to load pending invoices');
        } finally {
            setLoadingInvoices(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleInvoiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const invId = e.target.value;
        setValue('invoiceId', invId);

        const invoice = invoices.find(i => i.id === invId);
        if (invoice) {
            setValue('amount', (invoice.totalAmount - invoice.amountPaid).toString());
        } else {
            setValue('amount', '');
        }
    };

    const onSubmit = async (data: UploadPaymentProofFormValues) => {
        try {
            const formData = new FormData();
            formData.append('invoiceId', data.invoiceId);
            formData.append('amount', data.amount);
            formData.append('paymentDate', new Date(data.paymentDate).toISOString());
            formData.append('paymentMethod', data.paymentMethod);
            if (data.referenceNumber) {
                formData.append('notes', `Ref: ${data.referenceNumber}`);
            }

            if (file) {
                formData.append('file', file);
            }

            await PaymentsService.uploadClientPayment(formData);
            toast.success('Payment proof submitted successfully');
            await onSuccess();
            handleClose();
        } catch (err: any) {
            logger.error('Error uploading payment proof:', err);
            toast.error(err.response?.data?.message || err.message || 'Failed to submit payment proof');
        }
    };

    const handleClose = () => {
        reset();
        setFile(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-stone-200 flex justify-between items-center bg-stone-50">
                    <h3 className="text-lg font-semibold text-navy-900">Upload Payment Proof</h3>
                    <button
                        onClick={handleClose}
                        className="text-stone-400 hover:text-stone-600 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">

                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">
                            Select Invoice to Pay
                        </label>
                        <select
                            {...register('invoiceId', { required: 'Please select an invoice' })}
                            onChange={handleInvoiceChange}
                            disabled={loadingInvoices}
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-navy-900 focus:border-transparent outline-none transition-all disabled:bg-stone-100 ${errors.invoiceId ? 'border-red-300' : 'border-stone-300'}`}
                        >
                            <option value="">-- Select Invoice --</option>
                            {invoices.map((inv) => (
                                <option key={inv.id} value={inv.id}>
                                    #{inv.invoiceNumber} - Total: ${inv.totalAmount} (Due: ${inv.totalAmount - inv.amountPaid})
                                </option>
                            ))}
                        </select>
                        {errors.invoiceId && <p className="text-xs text-red-600 mt-1">{errors.invoiceId.message}</p>}
                        {loadingInvoices && <p className="text-xs text-stone-500 mt-1">Loading invoices...</p>}
                        {invoices.length === 0 && !loadingInvoices && <p className="text-xs text-orange-500 mt-1">No pending invoices found.</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">
                            Amount Paid (MXN)
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

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1">
                                Payment Method
                            </label>
                            <select
                                {...register('paymentMethod')}
                                className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-navy-900 focus:border-transparent outline-none transition-all"
                            >
                                <option value="TRANSFER">Transfer</option>
                                <option value="CHECK">Check</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1">
                                Payment Date
                            </label>
                            <input
                                type="date"
                                {...register('paymentDate', { required: 'Date is required' })}
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-navy-900 focus:border-transparent outline-none transition-all ${errors.paymentDate ? 'border-red-300' : 'border-stone-300'}`}
                            />
                            {errors.paymentDate && <p className="text-xs text-red-600 mt-1">{errors.paymentDate.message}</p>}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">
                            Reference Number (Optional)
                        </label>
                        <input
                            type="text"
                            {...register('referenceNumber')}
                            className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-navy-900 focus:border-transparent outline-none transition-all"
                            placeholder="e.g. Auth Code 12345"
                        />
                    </div>

                    {/* File Upload Placeholder */}
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">
                            Payment Proof (Screenshot/PDF)
                        </label>
                        <input
                            type="file"
                            accept="image/*,application/pdf"
                            onChange={handleFileChange}
                            className="w-full text-sm text-stone-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-navy-50 file:text-navy-700
                  hover:file:bg-navy-100"
                        />
                        <p className="text-xs text-stone-500 mt-1">
                            (Note: File upload is optional in this version)
                        </p>
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
                            disabled={isSubmitting || !selectedInvoiceId}
                            className="flex items-center justify-center flex-1 gap-2 px-4 py-2 font-medium text-white transition-colors bg-navy-900 rounded-lg hover:bg-navy-800 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>Uploading...</span>
                                </>
                            ) : (
                                'Submit Proof'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
