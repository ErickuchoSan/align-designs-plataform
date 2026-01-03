'use client';

import { useState, useEffect } from 'react';
import { InvoicesService } from '@/services/invoices.service';
import { CreateInvoiceDto } from '@/types/invoice'; // We might need to create this type if it doesn't exist
import { logger } from '@/lib/logger';

interface GenerateInvoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    onSuccess: () => void;
}

export default function GenerateInvoiceModal({
    isOpen,
    onClose,
    projectId,
    onSuccess,
}: GenerateInvoiceModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasUnpaid, setHasUnpaid] = useState(false);
    const [checkingUnpaid, setCheckingUnpaid] = useState(true);

    // Form State
    const [amount, setAmount] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [description, setDescription] = useState('');
    const [items, setItems] = useState([{ description: '', quantity: 1, unitPrice: 0 }]);

    // Check for unpaid invoices when modal opens
    useEffect(() => {
        if (isOpen) {
            checkForUnpaidInvoices();
        }
    }, [isOpen, projectId]);

    const checkForUnpaidInvoices = async () => {
        try {
            setCheckingUnpaid(true);
            const unpaid = await InvoicesService.hasUnpaidInvoices(projectId);
            setHasUnpaid(unpaid);
        } catch (err) {
            logger.error('Error checking unpaid invoices:', err);
        } finally {
            setCheckingUnpaid(false);
        }
    };

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            // Basic validation
            if (!amount || !dueDate) {
                throw new Error('Please fill in all required fields');
            }

            const payload = {
                projectId,
                totalAmount: Number(amount),
                dueDate: new Date(dueDate).toISOString(),
                items: items.map(item => ({
                    description: description || 'Professional Services', // Simplified for now
                    quantity: 1,
                    unitPrice: Number(amount)
                })),
                status: 'SENT' // Default status
            };

            await InvoicesService.create(payload as any); // Type assertion until DTO is fully defined
            await onSuccess();
            onClose();
        } catch (err: any) {
            logger.error('Error creating invoice:', err);
            setError(err.message || 'Failed to create invoice');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-stone-200 flex justify-between items-center bg-stone-50">
                    <h3 className="text-lg font-semibold text-navy-900">Generate Invoice</h3>
                    <button
                        onClick={onClose}
                        className="text-stone-400 hover:text-stone-600 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
                                        onClick={onClose}
                                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-colors text-sm"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            {error && (
                                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
                                    {error}
                                </div>
                            )}

                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">
                            Total Amount (MXN)
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-2 text-stone-500">$</span>
                            <input
                                type="number"
                                step="0.01"
                                required
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full pl-7 pr-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-navy-900 focus:border-transparent outline-none transition-all"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">
                            Due Date
                        </label>
                        <input
                            type="date"
                            required
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-navy-900 focus:border-transparent outline-none transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">
                            Description / Concept
                        </label>
                        <textarea
                            rows={3}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-navy-900 focus:border-transparent outline-none transition-all"
                            placeholder="e.g. Web Development Phase 1..."
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-navy-900 hover:bg-navy-800 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                        >
                            {loading ? (
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
