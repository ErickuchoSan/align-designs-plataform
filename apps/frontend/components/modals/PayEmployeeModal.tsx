'use client';

import { useState, useEffect } from 'react';
import { EmployeePaymentsService } from '@/services/employee-payments.service';
import { UsersService } from '@/services/users.service';
import { User } from '@/types'; // Adjust if User type is located elsewhere
import { logger } from '@/lib/logger';

interface PayEmployeeModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    onSuccess: () => void;
}

export default function PayEmployeeModal({
    isOpen,
    onClose,
    projectId,
    onSuccess,
}: PayEmployeeModalProps) {
    const [loading, setLoading] = useState(false);
    const [employees, setEmployees] = useState<User[]>([]);
    const [loadingEmployees, setLoadingEmployees] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form State
    const [employeeId, setEmployeeId] = useState('');
    const [amount, setAmount] = useState('');
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
    const [paymentMethod, setPaymentMethod] = useState('TRANSFER');
    const [description, setDescription] = useState('');

    // Pending Items State
    const [pendingItems, setPendingItems] = useState<any[]>([]);
    const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
    const [loadingItems, setLoadingItems] = useState(false);

    // Fetch employees when modal opens
    useEffect(() => {
        if (isOpen) {
            fetchEmployees();
        }
    }, [isOpen]);

    // Fetch pending items when employee is selected
    useEffect(() => {
        if (employeeId && projectId) {
            fetchPendingItems();
        } else {
            setPendingItems([]);
            setSelectedItemIds([]);
        }
    }, [employeeId, projectId]);

    const fetchEmployees = async () => {
        try {
            setLoadingEmployees(true);
            const data = await UsersService.getEmployees();
            setEmployees(data);
        } catch (err) {
            logger.error('Error fetching employees:', err);
            setError('Failed to load employee list');
        } finally {
            setLoadingEmployees(false);
        }
    };

    const fetchPendingItems = async () => {
        try {
            setLoadingItems(true);
            const items = await EmployeePaymentsService.getPendingItems(projectId, employeeId);
            setPendingItems(items);
        } catch (err) {
            logger.error('Error fetching pending items:', err);
            // Don't block payment if fetch fails, simplify let user proceed
        } finally {
            setLoadingItems(false);
        }
    };

    const toggleItemSelection = (itemId: string) => {
        setSelectedItemIds(prev =>
            prev.includes(itemId)
                ? prev.filter(id => id !== itemId)
                : [...prev, itemId]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            if (!employeeId || !amount || !paymentDate || !paymentMethod) {
                throw new Error('Please fill in all required fields');
            }

            const payload = {
                employeeId,
                amount: Number(amount),
                paymentMethod,
                paymentDate: new Date(paymentDate).toISOString(),
                description: description || undefined,
                projectItemIds: selectedItemIds.length > 0 ? selectedItemIds : undefined,
            };

            await EmployeePaymentsService.create(projectId, payload);
            await onSuccess();
            handleClose();
        } catch (err: any) {
            logger.error('Error recording payment:', err);
            setError(err.response?.data?.message || err.message || 'Failed to record payment');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        // Reset form
        setEmployeeId('');
        setAmount('');
        setPaymentDate(new Date().toISOString().split('T')[0]);
        setPaymentMethod('TRANSFER');
        setDescription('');
        setPendingItems([]);
        setSelectedItemIds([]);
        setError(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 bg-black/50 backdrop-blur-sm sm:p-4">
            <div className="w-full max-w-lg overflow-hidden bg-white shadow-xl rounded-xl max-h-[95vh] flex flex-col sm:max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between flex-shrink-0 px-4 py-3 border-b border-stone-200 bg-stone-50 sm:px-6 sm:py-4">
                    <h3 className="text-base font-semibold text-navy-900 sm:text-lg">Record Employee Payment</h3>
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
                <form onSubmit={handleSubmit} className="flex-grow p-4 space-y-4 overflow-y-auto sm:p-6">
                    {error && (
                        <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">
                            Select Employee
                        </label>
                        <select
                            value={employeeId}
                            onChange={(e) => setEmployeeId(e.target.value)}
                            required
                            disabled={loadingEmployees}
                            className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-navy-900 focus:border-transparent outline-none transition-all disabled:bg-stone-100"
                        >
                            <option value="">-- Select Employee --</option>
                            {employees.map((emp) => (
                                <option key={emp.id} value={emp.id}>
                                    {emp.firstName} {emp.lastName} ({emp.email})
                                </option>
                            ))}
                        </select>
                        {loadingEmployees && <p className="text-xs text-stone-500 mt-1">Loading employees...</p>}
                    </div>

                    {/* Pending Items Selection */}
                    {employeeId && (
                        <div className="border border-stone-200 rounded-lg p-3 bg-stone-50">
                            <label className="block text-sm font-medium text-stone-700 mb-2">
                                Client Approved Items (Unpaid)
                            </label>

                            {loadingItems ? (
                                <p className="text-xs text-stone-500">Loading pending items...</p>
                            ) : pendingItems.length === 0 ? (
                                <p className="text-xs text-stone-500 italic">No pending approved items found.</p>
                            ) : (
                                <div className="space-y-2 max-h-32 overflow-y-auto">
                                    {pendingItems.map((item) => (
                                        <div key={item.id} className="flex items-start gap-2">
                                            <input
                                                type="checkbox"
                                                id={`item-${item.id}`}
                                                checked={selectedItemIds.includes(item.id)}
                                                onChange={() => toggleItemSelection(item.id)}
                                                className="mt-1 rounded border-stone-300 text-navy-900 focus:ring-navy-900"
                                            />
                                            <label htmlFor={`item-${item.id}`} className="text-sm text-stone-700 cursor-pointer">
                                                <span className="font-medium block">{item.originalName || item.filename}</span>
                                                <span className="text-xs text-stone-500">
                                                    Apv: {new Date(item.approvedClientAt).toLocaleDateString()}
                                                </span>
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">
                            Amount (MXN)
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

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label className="block mb-1 text-sm font-medium text-stone-700">
                                Payment Method
                            </label>
                            <input
                                type="text"
                                value="Transfer"
                                disabled
                                className="w-full px-4 py-2 text-stone-500 border border-stone-300 rounded-lg cursor-not-allowed bg-stone-100"
                            />
                        </div>
                        <div>
                            <label className="block mb-1 text-sm font-medium text-stone-700">
                                Payment Date
                            </label>
                            <input
                                type="date"
                                required
                                value={paymentDate}
                                onChange={(e) => setPaymentDate(e.target.value)}
                                className="w-full px-4 py-2 transition-all border border-stone-300 rounded-lg outline-none focus:ring-2 focus:ring-navy-900 focus:border-transparent"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">
                            Description / Notes (Optional)
                        </label>
                        <textarea
                            rows={2}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-navy-900 focus:border-transparent outline-none transition-all"
                            placeholder="e.g. Salary advance, Phase 1 Completion..."
                        />
                    </div>

                    <div className="flex flex-col gap-2 pt-4 flex-shrink-0 sm:flex-row sm:gap-3">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 px-4 py-2 font-medium text-stone-700 transition-colors bg-stone-100 rounded-lg hover:bg-stone-200"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !employeeId}
                            className="flex items-center justify-center flex-1 gap-2 px-4 py-2 font-medium text-white transition-colors bg-navy-900 rounded-lg hover:bg-navy-800 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>Saving...</span>
                                </>
                            ) : (
                                'Record Payment'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
