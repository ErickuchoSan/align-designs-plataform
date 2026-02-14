import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { PaymentMethod, PaymentType } from '@/types/payments';
import { PaymentMethodSelect } from './PaymentMethodSelect';
import { ButtonLoader } from '@/components/ui/Loader';
import { toast } from 'react-hot-toast';
import { PaymentsService } from '@/services/payments.service';
import { UsersService } from '@/services/users.service';
import { FilesService, FileData } from '@/services/files.service';
import { User } from '@/types';
import { logger } from '@/lib/logger';
import { handleApiError } from '@/lib/errors';

interface RecordPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    onSuccess: () => void;
    initialAmount?: number;
    defaultType?: PaymentType;
}

export default function RecordPaymentModal({
    isOpen,
    onClose,
    projectId,
    onSuccess,
    initialAmount,
    defaultType = PaymentType.INITIAL_PAYMENT
}: RecordPaymentModalProps) {
    const [amount, setAmount] = useState<number | string>(initialAmount || '');
    const [method, setMethod] = useState<PaymentMethod>(PaymentMethod.TRANSFER);
    const [type, setType] = useState<PaymentType>(defaultType);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [notes, setNotes] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Employee Payment State
    const [employees, setEmployees] = useState<User[]>([]);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
    const [pendingFiles, setPendingFiles] = useState<FileData[]>([]);
    const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
    const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
    const [isLoadingFiles, setIsLoadingFiles] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setType(defaultType);
            if (defaultType === PaymentType.EMPLOYEE_PAYMENT) {
                loadEmployees();
            }
        }
    }, [isOpen, defaultType]);

    useEffect(() => {
        if (selectedEmployeeId) {
            loadPendingFiles(selectedEmployeeId);
        } else {
            setPendingFiles([]);
        }
    }, [selectedEmployeeId]);

    const loadEmployees = async () => {
        setIsLoadingEmployees(true);
        try {
            const data = await UsersService.getEmployees();
            setEmployees(data);
        } catch (error) {
            logger.error('Failed to load employees for payment modal', error);
            toast.error('Error loading employees');
        } finally {
            setIsLoadingEmployees(false);
        }
    };

    const loadPendingFiles = async (employeeId: string) => {
        setIsLoadingFiles(true);
        try {
            const data = await FilesService.getPendingPaymentFiles(projectId, employeeId);
            setPendingFiles(data);
        } catch (error) {
            logger.error('Failed to load pending files for employee payment', error, { projectId, employeeId });
            toast.error('Error loading pending files');
        } finally {
            setIsLoadingFiles(false);
        }
    };

    const handleFileToggle = (fileId: string) => {
        setSelectedFileIds(prev =>
            prev.includes(fileId)
                ? prev.filter(id => id !== fileId)
                : [...prev, fileId]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || Number(amount) <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }

        if (type === PaymentType.EMPLOYEE_PAYMENT && !selectedEmployeeId) {
            toast.error('Select an employee');
            return;
        }

        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('projectId', projectId);
            formData.append('amount', amount.toString());
            formData.append('paymentMethod', method);
            formData.append('paymentDate', date);
            formData.append('type', type);
            if (notes) formData.append('notes', notes);
            if (file) formData.append('receiptFile', file);

            if (type === PaymentType.EMPLOYEE_PAYMENT) {
                formData.append('toUserId', selectedEmployeeId);
                selectedFileIds.forEach(id => formData.append('relatedFileIds[]', id));
            }

            // Since FormData handling of arrays varies, let's try appending each.
            selectedFileIds.forEach(id => formData.append('relatedFileIds', id));

            await PaymentsService.create(formData);
            toast.success('Payment recorded successfully');
            onSuccess();
            onClose();
        } catch (error) {
            logger.error('Failed to record payment', error, { projectId, type, amount });
            toast.error(handleApiError(error, 'Error recording payment'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const isEmployeePayment = type === PaymentType.EMPLOYEE_PAYMENT;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isEmployeePayment ? "Record Employee Payment" : "Record Payment"}>
            <form onSubmit={handleSubmit} className="space-y-6">

                {/* Employee Selection */}
                {isEmployeePayment && (
                    <div>
                        <label className="block mb-2 text-sm font-medium text-stone-700">Employee</label>
                        <select
                            required
                            className="block w-full px-3 py-2 border rounded-lg shadow-sm border-stone-300 focus:border-transparent focus:ring-2 focus:ring-navy-900 sm:text-sm"
                            value={selectedEmployeeId}
                            onChange={(e) => setSelectedEmployeeId(e.target.value)}
                            disabled={isLoadingEmployees}
                        >
                            <option value="">Select Employee...</option>
                            {employees.map(emp => (
                                <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Pending Files Selection */}
                {isEmployeePayment && selectedEmployeeId && (
                    <div className="p-4 border rounded-lg border-stone-200 bg-stone-50">
                        <label className="block mb-2 text-sm font-medium text-stone-700">Pending Jobs</label>
                        {isLoadingFiles ? (
                            <div className="text-sm text-stone-500">Loading...</div>
                        ) : pendingFiles.length === 0 ? (
                            <div className="text-sm italic text-stone-400">No approved pending jobs</div>
                        ) : (
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                                {pendingFiles.map(f => (
                                    <div key={f.id} className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id={`file-${f.id}`}
                                            checked={selectedFileIds.includes(f.id)}
                                            onChange={() => handleFileToggle(f.id)}
                                            className="w-4 h-4 text-navy-600 border-stone-300 rounded focus:ring-navy-500"
                                        />
                                        <label htmlFor={`file-${f.id}`} className="block ml-2 text-sm truncate text-stone-900">
                                            {f.filename} <span className="text-xs text-stone-500">({new Date(f.approvedClientAt).toLocaleDateString()})</span>
                                        </label>
                                    </div>
                                ))}
                            </div>
                        )}
                        <p className="mt-2 text-xs text-stone-500">
                            Select the jobs you are paying for to calculate efficiency.
                        </p>
                    </div>
                )}

                <div>
                    <label className="block mb-2 text-sm font-medium text-stone-700">Amount</label>
                    <div className="relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <span className="text-stone-500 sm:text-sm">$</span>
                        </div>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            required
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="block w-full py-2 pl-7 pr-4 transition-all border outline-none rounded-lg border-stone-300 focus:ring-2 focus:ring-navy-900 focus:border-transparent text-sm"
                            placeholder="0.00"
                        />
                    </div>
                </div>

                <div>
                    <label className="block mb-2 text-sm font-medium text-stone-700">Payment Method</label>
                    <PaymentMethodSelect value={method} onChange={setMethod} />
                </div>

                <div>
                    <label className="block mb-2 text-sm font-medium text-stone-700">Payment Date</label>
                    <input
                        type="date"
                        required
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="block w-full px-4 py-2 transition-all border outline-none rounded-lg border-stone-300 shadow-sm focus:ring-2 focus:ring-navy-900 focus:border-transparent text-sm"
                    />
                </div>

                <div>
                    <label className="block mb-2 text-sm font-medium text-stone-700">Receipt (Optional)</label>
                    <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                        className="block w-full text-sm text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-stone-100 file:text-navy-700 hover:file:bg-stone-200"
                    />
                </div>

                <div>
                    <label className="block mb-2 text-sm font-medium text-stone-700">Notes</label>
                    <textarea
                        rows={3}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="block w-full px-4 py-2 transition-all border outline-none rounded-lg border-stone-300 focus:ring-2 focus:ring-navy-900 focus:border-transparent text-sm"
                        placeholder="Additional details..."
                    />
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-200">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="mr-3 px-4 py-2 text-sm font-medium text-stone-700 bg-white border border-stone-300 rounded-lg hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-navy-900"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex justify-center px-4 py-2 text-sm font-medium text-white bg-navy-900 border border-transparent rounded-lg hover:bg-navy-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-navy-900 min-w-[120px]"
                    >
                        {isSubmitting ? <ButtonLoader /> : 'Record Payment'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
