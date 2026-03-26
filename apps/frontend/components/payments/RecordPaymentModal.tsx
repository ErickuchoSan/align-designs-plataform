import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { PaymentMethod, PaymentType } from '@/types/payments';
import { PaymentMethodSelect } from './PaymentMethodSelect';
import { ButtonLoader } from '@/components/ui/Loader';
import { toast } from '@/lib/toast';
import {
  useEmployeesQuery,
  usePendingPaymentFilesQuery,
  useRecordPaymentMutation,
} from '@/hooks/queries';
import { getTodayDateString, formatDate } from '@/lib/date.utils';
import { cn, INPUT_BASE, INPUT_VARIANTS, TEXTAREA_BASE, BUTTON_BASE, BUTTON_VARIANTS, BUTTON_SIZES, CHECKBOX_BASE } from '@/lib/styles';

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
}: Readonly<RecordPaymentModalProps>) {
    const [amount, setAmount] = useState<number | string>(initialAmount || '');
    const [method, setMethod] = useState<PaymentMethod>(PaymentMethod.TRANSFER);
    const [type, setType] = useState<PaymentType>(defaultType);
    const [date, setDate] = useState(getTodayDateString());
    const [notes, setNotes] = useState('');
    const [file, setFile] = useState<File | null>(null);

    // Employee Payment State
    const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
    const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);

    const isEmployeePaymentMode = isOpen && defaultType === PaymentType.EMPLOYEE_PAYMENT;

    // TanStack Query: fetch employees when modal opens for employee payment
    const { data: employees = [], isLoading: isLoadingEmployees } = useEmployeesQuery({
        enabled: isEmployeePaymentMode,
    });

    // TanStack Query: fetch pending files when employee is selected
    const { data: pendingFiles = [], isLoading: isLoadingFiles } = usePendingPaymentFilesQuery(
        projectId,
        selectedEmployeeId,
        { enabled: !!selectedEmployeeId }
    );

    // TanStack Query: record payment mutation
    const recordPaymentMutation = useRecordPaymentMutation();

    // Reset type when modal opens
    useEffect(() => {
        if (isOpen) {
            setType(defaultType);
        }
    }, [isOpen, defaultType]);

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

        recordPaymentMutation.mutate(formData, {
            onSuccess: () => {
                onSuccess();
                onClose();
            },
        });
    };

    const isEmployeePayment = type === PaymentType.EMPLOYEE_PAYMENT;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isEmployeePayment ? "Record Employee Payment" : "Record Payment"}>
            <form onSubmit={handleSubmit} className="space-y-6">

                {/* Employee Selection */}
                {isEmployeePayment && (
                    <div>
                        <label htmlFor="record-payment-employee" className="block mb-2 text-sm font-medium text-stone-700">Employee</label>
                        <select
                            id="record-payment-employee"
                            required
                            className={cn(INPUT_BASE, INPUT_VARIANTS.default)}
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
                    <fieldset className="p-4 border rounded-lg border-stone-200 bg-stone-50">
                        <legend className="block mb-2 text-sm font-medium text-stone-700">Pending Jobs</legend>
                        {isLoadingFiles && (
                            <div className="text-sm text-stone-500">Loading...</div>
                        )}
                        {!isLoadingFiles && pendingFiles.length === 0 && (
                            <div className="text-sm italic text-stone-400">No approved pending jobs</div>
                        )}
                        {!isLoadingFiles && pendingFiles.length > 0 && (
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                                {pendingFiles.map(f => (
                                    <div key={f.id} className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id={`file-${f.id}`}
                                            checked={selectedFileIds.includes(f.id)}
                                            onChange={() => handleFileToggle(f.id)}
                                            className={CHECKBOX_BASE}
                                        />
                                        <label htmlFor={`file-${f.id}`} className="block ml-2 text-sm truncate text-stone-900">
                                            {f.filename} <span className="text-xs text-stone-500">({formatDate(f.approvedClientAt)})</span>
                                        </label>
                                    </div>
                                ))}
                            </div>
                        )}
                        <p className="mt-2 text-xs text-stone-500">
                            Select the jobs you are paying for to calculate efficiency.
                        </p>
                    </fieldset>
                )}

                <div>
                    <label htmlFor="record-payment-amount" className="block mb-2 text-sm font-medium text-stone-700">Amount</label>
                    <div className="relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <span className="text-stone-500 sm:text-sm">$</span>
                        </div>
                        <input
                            id="record-payment-amount"
                            type="number"
                            step="0.01"
                            min="0"
                            required
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className={cn(INPUT_BASE, INPUT_VARIANTS.default, 'pl-7 pr-4')}
                            placeholder="0.00"
                        />
                    </div>
                </div>

                <fieldset>
                    <legend className="block mb-2 text-sm font-medium text-stone-700">Payment Method</legend>
                    <PaymentMethodSelect value={method} onChange={setMethod} />
                </fieldset>

                <div>
                    <label htmlFor="record-payment-date" className="block mb-2 text-sm font-medium text-stone-700">Payment Date</label>
                    <input
                        id="record-payment-date"
                        type="date"
                        required
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className={cn(INPUT_BASE, INPUT_VARIANTS.default)}
                    />
                </div>

                <div>
                    <label htmlFor="record-payment-receipt" className="block mb-2 text-sm font-medium text-stone-700">Receipt (Optional)</label>
                    <input
                        id="record-payment-receipt"
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                        className="block w-full text-sm text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-stone-100 file:text-navy-700 hover:file:bg-stone-200"
                    />
                </div>

                <div>
                    <label htmlFor="record-payment-notes" className="block mb-2 text-sm font-medium text-stone-700">Notes</label>
                    <textarea
                        id="record-payment-notes"
                        rows={3}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className={cn(TEXTAREA_BASE, INPUT_VARIANTS.default)}
                        placeholder="Additional details..."
                    />
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-200">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={recordPaymentMutation.isPending}
                        className={cn(BUTTON_BASE, BUTTON_VARIANTS.ghost, BUTTON_SIZES.md, 'mr-3 border border-stone-300')}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={recordPaymentMutation.isPending}
                        className={cn(BUTTON_BASE, BUTTON_VARIANTS.primary, BUTTON_SIZES.md)}
                    >
                        {recordPaymentMutation.isPending ? <ButtonLoader /> : 'Record Payment'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}