'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PaymentHistoryTable } from '@/components/payments/PaymentHistoryTable';
import { RecordPaymentModal } from '@/components/payments/RecordPaymentModal';
import { PaymentsService } from '@/services/payments.service';
import { Payment, PaymentType } from '@/types/payments';
import { toast } from 'react-hot-toast';
import { ProjectsService } from '@/services/projects.service';
import { Project } from '@/types';

export default function ProjectPaymentsPage() {
    const params = useParams();
    const router = useRouter();
    const projectId = params.id as string;

    const [payments, setPayments] = useState<Payment[]>([]);
    const [project, setProject] = useState<Project | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
    const [paymentModalType, setPaymentModalType] = useState<PaymentType>(PaymentType.INITIAL_PAYMENT);

    // Fetch project and payments
    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [paymentsData, projectData] = await Promise.all([
                PaymentsService.findAllByProject(projectId),
                ProjectsService.getById(projectId)
            ]);
            setPayments(paymentsData);
            setProject(projectData);
        } catch (error) {
            console.error('Error loading payments data:', error);
            toast.error('Error al cargar la información de pagos');
        } finally {
            setIsLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        if (projectId) {
            loadData();
        }
    }, [projectId, loadData]);

    const openModal = (type: PaymentType) => {
        setPaymentModalType(type);
        setIsRecordModalOpen(true);
    };

    if (!projectId) return null;

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <button
                        onClick={() => router.back()}
                        className="text-gray-500 hover:text-gray-700 mb-2 flex items-center gap-1 text-sm"
                    >
                        ← Volver al Proyecto
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Historial de Pagos
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Proyecto: {project?.name || '...'}
                    </p>
                </div>

                <div className="flex gap-3 items-center">
                    <div className="text-right mr-4">
                        <div className="text-sm text-gray-500">Monto Pagado</div>
                        <div className="text-xl font-bold text-green-600">
                            ${Number(project?.amountPaid || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                        {project?.initialAmountRequired && (
                            <div className="text-xs text-gray-400">
                                de ${Number(project.initialAmountRequired).toLocaleString()} requeridos
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => openModal(PaymentType.INITIAL_PAYMENT)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm flex items-center"
                    >
                        + Registrar Ingreso
                    </button>
                    <button
                        onClick={() => openModal(PaymentType.EMPLOYEE_PAYMENT)}
                        className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium shadow-sm flex items-center"
                    >
                        - Pago a Empleado
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <PaymentHistoryTable payments={payments} isLoading={isLoading} />
            </div>

            <RecordPaymentModal
                isOpen={isRecordModalOpen}
                onClose={() => setIsRecordModalOpen(false)}
                projectId={projectId}
                onSuccess={loadData}
                initialAmount={
                    paymentModalType === PaymentType.INITIAL_PAYMENT && project?.initialAmountRequired && project?.amountPaid
                        ? Math.max(0, Number(project.initialAmountRequired) - Number(project.amountPaid))
                        : 0
                }
                defaultType={paymentModalType}
            />
        </div>
    );
}
