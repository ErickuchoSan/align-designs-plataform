import { useState, useEffect } from 'react';
import Modal from '@/app/components/Modal';
import { PaymentMethod, PaymentType } from '@/types/payments';
import { PaymentMethodSelect } from './PaymentMethodSelect';
import { ButtonLoader } from '@/app/components/Loader';
import { toast } from 'react-hot-toast';
import { PaymentsService } from '@/services/payments.service';
import { UsersService } from '@/services/users.service';
import { FilesService, FileData } from '@/services/files.service';
import { User } from '@/types';

interface RecordPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    onSuccess: () => void;
    initialAmount?: number;
    defaultType?: PaymentType;
}

export function RecordPaymentModal({
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
            console.error('Error loading employees:', error);
            toast.error('Error al cargar empleados');
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
            console.error('Error loading pending files:', error);
            toast.error('Error al cargar archivos pendientes');
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
            toast.error('Por favor ingresa un monto válido');
            return;
        }

        if (type === PaymentType.EMPLOYEE_PAYMENT && !selectedEmployeeId) {
            toast.error('Selecciona un empleado');
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
                selectedFileIds.forEach(id => formData.append('relatedFileIds[]', id)); // Arrays in FormData can be tricky, backend must handle
                // Actually Backend DTO expects JSON array if handled as strict, but Nestjs FileInterceptor + Body might handle array fields
                // Simpler: Send relatedFileIds as comma separated string? Or multiple fields. 
                // NestJS with 'files' interceptor usually parses body. 
                // Let's rely on standard FormData behavior.
                // If this fails, we might need to JSON.stringify the array.
                // Wait, RecordPaymentDto uses `relatedFileIds?: string[]`.
            }

            // Since FormData handling of arrays varies, let's try appending each.
            // Backend Controller uses `@Body` which usually parses FormData fields.
            // If relatedFileIds is coming as array of strings, `relatedFileIds[]` naming conventions might apply depending on parsing middleware. 
            // In NestJS + Multer, `relatedFileIds` (multiple times) works if DTO expects it.

            // HOWEVER, creating `formData` manually:
            // `formData.append('relatedFileIds', id)` multiple times is the standard way.
            selectedFileIds.forEach(id => formData.append('relatedFileIds', id));

            await PaymentsService.create(formData);
            toast.success('Pago registrado exitosamente');
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error recording payment:', error);
            toast.error('Error al registrar el pago');
        } finally {
            setIsSubmitting(false);
        }
    };

    const isEmployeePayment = type === PaymentType.EMPLOYEE_PAYMENT;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isEmployeePayment ? "Registrar Pago a Empleado" : "Registrar Pago"}>
            <form onSubmit={handleSubmit} className="space-y-6">

                {/* Employee Selection */}
                {isEmployeePayment && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Empleado</label>
                        <select
                            required
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 border px-3"
                            value={selectedEmployeeId}
                            onChange={(e) => setSelectedEmployeeId(e.target.value)}
                            disabled={isLoadingEmployees}
                        >
                            <option value="">Seleccionar Empleado...</option>
                            {employees.map(emp => (
                                <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Pending Files Selection */}
                {isEmployeePayment && selectedEmployeeId && (
                    <div className="border rounded-md p-4 bg-gray-50">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Trabajos Pendientes de Pago</label>
                        {isLoadingFiles ? (
                            <div className="text-sm text-gray-500">Cargando...</div>
                        ) : pendingFiles.length === 0 ? (
                            <div className="text-sm text-gray-400 italic">No hay trabajos pendientes aprobados</div>
                        ) : (
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                                {pendingFiles.map(f => (
                                    <div key={f.id} className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id={`file-${f.id}`}
                                            checked={selectedFileIds.includes(f.id)}
                                            onChange={() => handleFileToggle(f.id)}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                        <label htmlFor={`file-${f.id}`} className="ml-2 block text-sm text-gray-900 truncate">
                                            {f.filename} <span className="text-xs text-gray-500">({new Date(f.approvedClientAt).toLocaleDateString()})</span>
                                        </label>
                                    </div>
                                ))}
                            </div>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                            Seleccione los trabajos que está pagando para calcular eficiencia.
                        </p>
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Monto</label>
                    <div className="relative rounded-md shadow-sm">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <span className="text-gray-500 sm:text-sm">$</span>
                        </div>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            required
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="block w-full rounded-md border-gray-300 pl-7 pr-12 focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-3 border"
                            placeholder="0.00"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Método de Pago</label>
                    <PaymentMethodSelect value={method} onChange={setMethod} />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Fecha del Pago</label>
                    <input
                        type="date"
                        required
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 border px-3"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Comprobante (Opcional)</label>
                    <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Notas</label>
                    <textarea
                        rows={3}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 border px-3"
                        placeholder="Detalles adicionales..."
                    />
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-200">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="mr-3 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 min-w-[120px]"
                    >
                        {isSubmitting ? <ButtonLoader /> : 'Registrar Pago'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
