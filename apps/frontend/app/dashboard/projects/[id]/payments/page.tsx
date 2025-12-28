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
import DashboardHeader from '@/app/components/DashboardHeader';

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
        <div className="min-h-screen bg-stone-50">
            <DashboardHeader
                title={`Historial de Pagos - ${project?.name || 'Proyecto'}`}
                showBackButton
                backUrl={`/dashboard/projects/${projectId}`}
            />
            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center mb-6">
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
            </main>
        </div>
    );
}
