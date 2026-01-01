'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import PaymentHistoryTable from '@/components/payments/PaymentHistoryTable';
import { RecordPaymentModal } from '@/components/payments/RecordPaymentModal';
import ClientPaymentUploadModal from '@/components/payments/ClientPaymentUploadModal';
import AdminPaymentReviewModal from '@/components/payments/AdminPaymentReviewModal';
import { PaymentsService } from '@/services/payments.service';
import { Payment, PaymentType } from '@/types/payments';
import { toast } from 'react-hot-toast';
import { ProjectsService } from '@/services/projects.service';
import { Project } from '@/types';
import DashboardHeader from '@/app/components/DashboardHeader';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';

export default function ProjectPaymentsPage() {
    const params = useParams();
    const router = useRouter();
    const projectId = params.id as string;
    const { user, isAdmin, loading: authLoading } = useProtectedRoute();

    const [payments, setPayments] = useState<Payment[]>([]);
    const [project, setProject] = useState<Project | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
    const [isClientUploadModalOpen, setIsClientUploadModalOpen] = useState(false);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
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
            toast.error('Error loading payment information');
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

    const handleViewReceipt = (payment: Payment) => {
        setSelectedPayment(payment);
        setIsReviewModalOpen(true);
    };

    if (!projectId || authLoading) return null;

    const isClient = user?.role === 'CLIENT';

    // Memoize expensive calculations
    const remainingAmount = useMemo(() => {
        if (!project?.initialAmountRequired || !project?.amountPaid) return 0;
        return Math.max(0, Number(project.initialAmountRequired) - Number(project.amountPaid));
    }, [project?.initialAmountRequired, project?.amountPaid]);

    const paymentProgress = useMemo(() => {
        if (!project?.initialAmountRequired) return 0;
        const progress = (Number(project.amountPaid || 0) / Number(project.initialAmountRequired)) * 100;
        return Math.min(100, progress);
    }, [project?.initialAmountRequired, project?.amountPaid]);

    return (
        <div className="min-h-screen bg-stone-50">
            <DashboardHeader
                title={`${isClient ? 'My Payments' : 'Payment History'} - ${project?.name || 'Project'}`}
                showBackButton
                backUrl={`/dashboard/projects/${projectId}`}
            />
            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                {/* Client View */}
                {isClient && (
                    <>
                        {/* Payment Progress Card */}
                        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 mb-6">
                            <h2 className="text-lg font-semibold text-navy-900 mb-4">Initial Payment Status</h2>
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <div className="text-sm text-gray-600">Amount Paid</div>
                                    <div className="text-2xl font-bold text-green-600">
                                        ${Number(project?.amountPaid || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-600">Amount Required</div>
                                    <div className="text-2xl font-bold text-navy-900">
                                        ${Number(project?.initialAmountRequired || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-600">Remaining</div>
                                    <div className="text-2xl font-bold text-amber-600">
                                        ${remainingAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </div>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                                <div
                                    className="bg-green-600 h-3 rounded-full transition-all duration-300"
                                    style={{ width: `${paymentProgress}%` }}
                                />
                            </div>

                            <button
                                onClick={() => setIsClientUploadModalOpen(true)}
                                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm flex items-center justify-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                                Upload Payment Proof
                            </button>
                        </div>

                        {/* Client Payment History */}
                        <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
                            <div className="p-4 border-b border-stone-200">
                                <h3 className="text-lg font-semibold text-navy-900">Receipt History</h3>
                            </div>
                            <PaymentHistoryTable
                                payments={payments}
                                isLoading={isLoading}
                                isAdmin={false}
                            />
                        </div>

                        <ClientPaymentUploadModal
                            isOpen={isClientUploadModalOpen}
                            onClose={() => setIsClientUploadModalOpen(false)}
                            projectId={projectId}
                            onSuccess={loadData}
                            suggestedAmount={remainingAmount}
                        />
                    </>
                )}

                {/* Admin View */}
                {isAdmin && (
                    <>
                        <div className="flex justify-between items-center mb-6">
                            <div className="text-right mr-4">
                                <div className="text-sm text-gray-500">Amount Paid</div>
                                <div className="text-xl font-bold text-green-600">
                                    ${Number(project?.amountPaid || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </div>
                                {project?.initialAmountRequired && (
                                    <div className="text-xs text-gray-400">
                                        of ${Number(project.initialAmountRequired).toLocaleString()} required
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => openModal(PaymentType.INITIAL_PAYMENT)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm flex items-center"
                            >
                                + Record Income
                            </button>
                            <button
                                onClick={() => openModal(PaymentType.EMPLOYEE_PAYMENT)}
                                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium shadow-sm flex items-center"
                            >
                                - Pay Employee
                            </button>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <PaymentHistoryTable
                                payments={payments}
                                isLoading={isLoading}
                                onViewReceipt={handleViewReceipt}
                                isAdmin={true}
                            />
                        </div>

                        <RecordPaymentModal
                            isOpen={isRecordModalOpen}
                            onClose={() => setIsRecordModalOpen(false)}
                            projectId={projectId}
                            onSuccess={loadData}
                            initialAmount={remainingAmount}
                            defaultType={paymentModalType}
                        />

                        {selectedPayment && (
                            <AdminPaymentReviewModal
                                isOpen={isReviewModalOpen}
                                onClose={() => setIsReviewModalOpen(false)}
                                payment={selectedPayment}
                                onSuccess={loadData}
                            />
                        )}
                    </>
                )}
            </main>
        </div>
    );
}
