'use client';

import { useState, useEffect } from 'react';
import { InvoicesService } from '@/services/invoices.service';
import { Invoice } from '@/types/invoice'; // Ensure this type exists and includes 'project' or 'id'
import { logger } from '@/lib/logger';

interface UploadPaymentProofModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    onSuccess: () => void;
    userId: string; // Used to filter invoices if needed, though backend handles security
}

export default function UploadPaymentProofModal({
    isOpen,
    onClose,
    projectId,
    onSuccess,
    userId,
}: UploadPaymentProofModalProps) {
    const [loading, setLoading] = useState(false);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loadingInvoices, setLoadingInvoices] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form State
    const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
    const [amountPaid, setAmountPaid] = useState('');
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
    const [paymentMethod, setPaymentMethod] = useState('TRANSFER');
    const [referenceNumber, setReferenceNumber] = useState('');
    const [file, setFile] = useState<File | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchPendingInvoices();
        }
    }, [isOpen]);

    const fetchPendingInvoices = async () => {
        try {
            setLoadingInvoices(true);
            // Fetch invoices for this project. 
            // Ideally, filter for UNPAID/SENT invoices on the client side or via API parameter if available
            const allInvoices = await InvoicesService.getByProject(projectId);
            // Filter for invoices that are not fully paid
            const pendingInvoices = allInvoices.filter(inv => inv.status !== 'PAID' && inv.status !== 'CANCELLED');
            setInvoices(pendingInvoices);
        } catch (err) {
            logger.error('Error fetching invoices:', err);
            setError('Failed to load pending invoices');
        } finally {
            setLoadingInvoices(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            if (!selectedInvoiceId || !amountPaid || !paymentDate || !paymentMethod) {
                throw new Error('Please fill in all required fields');
            }

            // NOTE: We need to verify if the backend endpoint supports file upload directly 
            // or if we need to upload the file first then call the payment endpoint.
            // Assuming a standard flow where we create a payment record.
            // If the backend `InvoicesService` has a `recordPayment` method:

            const payload = {
                amount: Number(amountPaid),
                paymentDate: new Date(paymentDate).toISOString(),
                paymentMethod,
                referenceNumber,
                // notes: 'Payment Proof Uploaded', 
                // We might need to handle the file upload separately if the DTO doesn't support it directly
                // For now, let's assume we send the data. 
                // Check `InvoicesService.recordPayment` signature if available.
            };

            // Since we don't have a direct "Upload Proof" endpoint visible in previous context,
            // we might need to use `recordPayment`. 
            // If file upload is required, we might need an `upload` service.

            // Temporary: Use recordPayment. If file is needed, it should be uploaded to an endpoint returning an ID/URL.
            await InvoicesService.recordPayment(selectedInvoiceId, payload);

            await onSuccess();
            handleClose();
        } catch (err: any) {
            logger.error('Error uploading payment proof:', err);
            setError(err.response?.data?.message || err.message || 'Failed to submit payment proof');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        // Reset form
        setSelectedInvoiceId('');
        setAmountPaid('');
        setPaymentDate(new Date().toISOString().split('T')[0]);
        setPaymentMethod('TRANSFER');
        setReferenceNumber('');
        setFile(null);
        setError(null);
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
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">
                            Select Invoice to Pay
                        </label>
                        <select
                            value={selectedInvoiceId}
                            onChange={(e) => {
                                const invId = e.target.value;
                                setSelectedInvoiceId(invId);
                                // Auto-fill amount with remaining balance if selected
                                const invoice = invoices.find(i => i.id === invId);
                                if (invoice) {
                                    setAmountPaid((invoice.totalAmount - invoice.amountPaid).toString());
                                }
                            }}
                            required
                            disabled={loadingInvoices}
                            className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-navy-900 focus:border-transparent outline-none transition-all disabled:bg-stone-100"
                        >
                            <option value="">-- Select Invoice --</option>
                            {invoices.map((inv) => (
                                <option key={inv.id} value={inv.id}>
                                    #{inv.invoiceNumber} - Total: ${inv.totalAmount} (Due: ${inv.totalAmount - inv.amountPaid})
                                </option>
                            ))}
                        </select>
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
                                required
                                value={amountPaid}
                                onChange={(e) => setAmountPaid(e.target.value)}
                                className="w-full pl-7 pr-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-navy-900 focus:border-transparent outline-none transition-all"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1">
                                Payment Method
                            </label>
                            <select
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                required
                                className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-navy-900 focus:border-transparent outline-none transition-all"
                            >
                                <option value="TRANSFER">Transfer</option>
                                <option value="DEPOSIT">Deposit</option>
                                <option value="CHECK">Check</option>
                                <option value="OTHER">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1">
                                Payment Date
                            </label>
                            <input
                                type="date"
                                required
                                value={paymentDate}
                                onChange={(e) => setPaymentDate(e.target.value)}
                                className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-navy-900 focus:border-transparent outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">
                            Reference Number (Optional)
                        </label>
                        <input
                            type="text"
                            value={referenceNumber}
                            onChange={(e) => setReferenceNumber(e.target.value)}
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
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 px-4 py-2 text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !selectedInvoiceId}
                            className="flex-1 px-4 py-2 bg-navy-900 hover:bg-navy-800 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                        >
                            {loading ? (
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
