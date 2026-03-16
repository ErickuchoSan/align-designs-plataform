'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { InvoicesService } from '@/services/invoices.service';
import { PaymentsService } from '@/services/payments.service';
import { Invoice } from '@/types/invoice';
import { handleApiError } from '@/lib/errors';
import { toast } from '@/lib/toast';
import { CloseIcon } from '@/components/ui/icons';
import { useFetchOnOpen } from '@/hooks';
import { getTodayDateString } from '@/lib/utils/date-formatter';
import { cn, INPUT_BASE, INPUT_VARIANTS, BUTTON_BASE, BUTTON_VARIANTS, BUTTON_SIZES } from '@/lib/styles';

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
}: Readonly<UploadPaymentProofModalProps>) {
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
            paymentDate: getTodayDateString(),
            paymentMethod: 'TRANSFER',
            referenceNumber: ''
        }
    });

    const selectedInvoiceId = watch('invoiceId');

    // DRY: Fetch invoices when modal opens
    const { data: invoices, loading: loadingInvoices } = useFetchOnOpen<Invoice[]>(
        isOpen,
        async () => {
            const allInvoices = await InvoicesService.getByProject(projectId);
            return allInvoices.filter(inv => inv.status !== 'PAID' && inv.status !== 'CANCELLED');
        },
        { deps: [projectId], initialData: [], errorPrefix: 'Failed to load invoices' }
    );

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
        }
    };

    const handleInvoiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const invId = e.target.value;
        setValue('invoiceId', invId);

        const invoice = (invoices ?? []).find(i => i.id === invId);
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
            onSuccess();
            handleClose();
        } catch (err) {
            toast.error(handleApiError(err, 'Failed to submit payment proof'));
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
                        <CloseIcon size="md" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">

                    <div>
                        <label htmlFor="payment-proof-invoiceId" className="block text-sm font-medium text-stone-700 mb-1">
                            Select Invoice to Pay
                        </label>
                        <select
                            id="payment-proof-invoiceId"
                            {...register('invoiceId', { required: 'Please select an invoice' })}
                            onChange={handleInvoiceChange}
                            disabled={loadingInvoices}
                            className={cn(INPUT_BASE, errors.invoiceId ? INPUT_VARIANTS.error : INPUT_VARIANTS.default, 'disabled:bg-stone-100')}
                        >
                            <option value="">-- Select Invoice --</option>
                            {(invoices ?? []).map((inv) => (
                                <option key={inv.id} value={inv.id}>
                                    #{inv.invoiceNumber} - Total: ${inv.totalAmount} (Due: ${inv.totalAmount - inv.amountPaid})
                                </option>
                            ))}
                        </select>
                        {errors.invoiceId && <p className="text-xs text-red-600 mt-1">{errors.invoiceId.message}</p>}
                        {loadingInvoices && <p className="text-xs text-stone-500 mt-1">Loading invoices...</p>}
                        {(invoices ?? []).length === 0 && !loadingInvoices && <p className="text-xs text-orange-500 mt-1">No pending invoices found.</p>}
                    </div>

                    <div>
                        <label htmlFor="payment-proof-amount" className="block text-sm font-medium text-stone-700 mb-1">
                            Amount Paid (USD)
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-2 text-stone-500">$</span>
                            <input
                                id="payment-proof-amount"
                                type="number"
                                step="0.01"
                                {...register('amount', { required: 'Amount is required' })}
                                className={cn(INPUT_BASE, errors.amount ? INPUT_VARIANTS.error : INPUT_VARIANTS.default, 'pl-7')}
                                placeholder="0.00"
                            />
                        </div>
                        {errors.amount && <p className="text-xs text-red-600 mt-1">{errors.amount.message}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="payment-proof-method" className="block text-sm font-medium text-stone-700 mb-1">
                                Payment Method
                            </label>
                            <select
                                id="payment-proof-method"
                                {...register('paymentMethod')}
                                className={cn(INPUT_BASE, INPUT_VARIANTS.default)}
                            >
                                <option value="TRANSFER">Transfer</option>
                                <option value="CHECK">Check</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="payment-proof-date" className="block text-sm font-medium text-stone-700 mb-1">
                                Payment Date
                            </label>
                            <input
                                id="payment-proof-date"
                                type="date"
                                {...register('paymentDate', { required: 'Date is required' })}
                                className={cn(INPUT_BASE, errors.paymentDate ? INPUT_VARIANTS.error : INPUT_VARIANTS.default)}
                            />
                            {errors.paymentDate && <p className="text-xs text-red-600 mt-1">{errors.paymentDate.message}</p>}
                        </div>
                    </div>

                    <div>
                        <label htmlFor="payment-proof-reference" className="block text-sm font-medium text-stone-700 mb-1">
                            Reference Number (Optional)
                        </label>
                        <input
                            id="payment-proof-reference"
                            type="text"
                            {...register('referenceNumber')}
                            className={cn(INPUT_BASE, INPUT_VARIANTS.default)}
                            placeholder="e.g. Auth Code 12345"
                        />
                    </div>

                    {/* File Upload Placeholder */}
                    <div>
                        <label htmlFor="payment-proof-file" className="block text-sm font-medium text-stone-700 mb-1">
                            Payment Proof (Screenshot/PDF)
                        </label>
                        <input
                            id="payment-proof-file"
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
                            className={cn(BUTTON_BASE, BUTTON_VARIANTS.secondary, BUTTON_SIZES.md, 'flex-1')}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || !selectedInvoiceId}
                            className={cn(BUTTON_BASE, BUTTON_VARIANTS.primary, BUTTON_SIZES.md, 'flex-1 gap-2')}
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
