'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import PaymentHistoryTable from '@/components/payments/PaymentHistoryTable';
import { RecordPaymentModal } from '@/components/payments/RecordPaymentModal';
import ClientPaymentUploadModal from '@/components/payments/ClientPaymentUploadModal';
import AdminPaymentReviewModal from '@/components/payments/AdminPaymentReviewModal';
import { PaymentsService } from '@/services/payments.service';
import { InvoicesService } from '@/services/invoices.service';
import { Payment, PaymentType } from '@/types/payments';
import { Invoice, InvoiceStatus } from '@/types/invoice';
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
    const [invoices, setInvoices] = useState<Invoice[]>([]);
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
            const [paymentsData, invoicesData, projectData] = await Promise.all([
                PaymentsService.findAllByProject(projectId),
                InvoicesService.getByProject(projectId),
                ProjectsService.getById(projectId)
            ]);
            setPayments(paymentsData);
            setInvoices(invoicesData);
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

    // Memoize expensive calculations
    const pendingAmount = useMemo(() => {
        return payments
            .filter(p => p.status === 'PENDING_APPROVAL')
            .reduce((sum, p) => sum + Number(p.amount), 0);
    }, [payments]);

    const remainingAmount = useMemo(() => {
        if (!project?.initialAmountRequired) return 0;
        const paid = Number(project.amountPaid || 0);
        return Math.max(0, Number(project.initialAmountRequired) - paid - pendingAmount);
    }, [project?.initialAmountRequired, project?.amountPaid, pendingAmount]);

    const isFullyCovered = remainingAmount === 0;

    const openModal = (type: PaymentType) => {
        setPaymentModalType(type);
        setIsRecordModalOpen(true);
    };

    const handleViewReceipt = (payment: Payment) => {
        setSelectedPayment(payment);
        setIsReviewModalOpen(true);
    };

    const handleViewInvoice = async (invoiceId: string) => {
        try {
            const blob = await InvoicesService.downloadPdf(invoiceId);
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');
        } catch (error) {
            console.error('Error downloading invoice:', error);
            toast.error('Could not download invoice. Please try again.');
        }
    };

    if (!projectId || authLoading) return null;

    const isClient = user?.role === 'CLIENT';

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
                        {/* Initial Payment Progress Card - Show only if relevant and not fully paid */}
                        {project?.initialAmountRequired && !isFullyCovered && (
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
                                        <div className={`text-2xl font-bold text-amber-600`}>
                                            ${remainingAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </div>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="w-full bg-gray-200 rounded-full h-3 mb-4 overflow-hidden relative">
                                    {/* Paid part */}
                                    <div
                                        className="bg-green-600 h-3 absolute left-0 top-0 transition-all duration-300"
                                        style={{ width: `${(Number(project?.amountPaid || 0) / Number(project?.initialAmountRequired || 1)) * 100}%` }}
                                    />
                                    {/* Pending part */}
                                    <div
                                        className="bg-yellow-400 h-3 absolute top-0 transition-all duration-300 opacity-80 striped-bar"
                                        style={{
                                            left: `${(Number(project?.amountPaid || 0) / Number(project?.initialAmountRequired || 1)) * 100}%`,
                                            width: `${(pendingAmount / Number(project?.initialAmountRequired || 1)) * 100}%`
                                        }}
                                    />
                                </div>

                                {pendingAmount > 0 && (
                                    <p className="text-sm text-yellow-600 mb-4 font-medium">
                                        <span className="inline-block w-2 h-2 rounded-full bg-yellow-400 mr-2"></span>
                                        ${pendingAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} pending approval
                                    </p>
                                )}

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
                        )}

                        {/* Client Invoices Section */}
                        <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden mb-6">
                            <div className="p-4 border-b border-stone-200 flex justify-between items-center">
                                <h3 className="text-lg font-semibold text-navy-900">Your Invoices</h3>
                                <div className="text-sm text-stone-500">
                                    {invoices.length} invoice(s)
                                </div>
                            </div>

                            {invoices.length === 0 ? (
                                <div className="p-8 text-center text-stone-500">
                                    No invoices found for this project.
                                </div>
                            ) : (
                                <>
                                    {/* Desktop Table View */}
                                    <div className="hidden md:block overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Invoice #</th>
                                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Paid</th>
                                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Due Date</th>
                                                    <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {invoices.map((invoice) => (
                                                    <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-navy-900">
                                                            #{invoice.invoiceNumber}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                                                            ${invoice.status === InvoiceStatus.PAID ? 'bg-green-100 text-green-800' :
                                                                    invoice.status === InvoiceStatus.OVERDUE ? 'bg-red-100 text-red-800' :
                                                                        'bg-gray-100 text-gray-800'}`}>
                                                                {invoice.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            ${invoice.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                                                            ${invoice.amountPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {new Date(invoice.dueDate).toLocaleDateString()}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                                            <button
                                                                onClick={() => handleViewInvoice(invoice.id)}
                                                                className="text-navy-600 hover:text-navy-900 transition-colors tooltip"
                                                                title="Download Invoice"
                                                            >
                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                                </svg>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Mobile Card View */}
                                    <div className="md:hidden p-4 space-y-3">
                                        {invoices.map((invoice) => (
                                            <div key={invoice.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div className="text-sm font-medium text-navy-900">
                                                        #{invoice.invoiceNumber}
                                                    </div>
                                                    <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full
                                                        ${invoice.status === InvoiceStatus.PAID ? 'bg-green-100 text-green-800' :
                                                            invoice.status === InvoiceStatus.OVERDUE ? 'bg-red-100 text-red-800' :
                                                                'bg-gray-100 text-gray-800'}`}>
                                                        {invoice.status}
                                                    </span>
                                                </div>
                                                <div className="space-y-2 text-sm mb-3">
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-500">Amount:</span>
                                                        <span className="font-medium text-gray-900">${invoice.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-500">Paid:</span>
                                                        <span className="font-medium text-green-600">${invoice.amountPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-500">Due Date:</span>
                                                        <span className="text-gray-700">{new Date(invoice.dueDate).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleViewInvoice(invoice.id)}
                                                    className="w-full px-4 py-2 bg-navy-600 text-white rounded-lg hover:bg-navy-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                    View Invoice
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
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
                            maxAmount={remainingAmount}
                        />
                    </>
                )}

                {/* Admin View */}
                {isAdmin && (
                    <>
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                                <div className="text-sm text-gray-500 mb-1">Amount Paid</div>
                                <div className="text-2xl font-bold text-green-600">
                                    ${Number(project?.amountPaid || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </div>
                                {project?.initialAmountRequired && (
                                    <div className="text-xs text-gray-400 mt-1">
                                        of ${Number(project.initialAmountRequired).toLocaleString()} required
                                    </div>
                                )}
                            </div>

                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                                <div className="text-sm text-gray-500 mb-1">Total Invoiced</div>
                                <div className="text-2xl font-bold text-navy-900">
                                    ${invoices.reduce((sum, i) => sum + i.totalAmount, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </div>
                                <div className="text-xs text-gray-400 mt-1">
                                    {invoices.length} invoices generated
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                                <div className="text-sm text-gray-500 mb-1">Pending Approval</div>
                                <div className="text-2xl font-bold text-yellow-600">
                                    {payments.filter(p => p.status === 'PENDING_APPROVAL').length}
                                </div>
                                <div className="text-xs text-gray-400 mt-1">
                                    payments waiting
                                </div>
                            </div>
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                                <div className="text-sm text-gray-500 mb-1">Total Payments</div>
                                <div className="text-2xl font-bold text-navy-900">
                                    {payments.length}
                                </div>
                                <div className="text-xs text-gray-400 mt-1">
                                    all time
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 mb-6">
                            <button
                                onClick={() => openModal(PaymentType.INITIAL_PAYMENT)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm flex items-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Record Income
                            </button>
                            <button
                                onClick={() => openModal(PaymentType.EMPLOYEE_PAYMENT)}
                                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium shadow-sm flex items-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                </svg>
                                Pay Employee
                            </button>
                        </div>

                        {/* Invoices Table for Admin */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
                            <div className="p-4 border-b border-gray-200 bg-gray-50">
                                <h3 className="text-lg font-semibold text-navy-900">Project Invoices</h3>
                            </div>
                            {invoices.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">
                                    No invoices generated yet.
                                </div>
                            ) : (
                                <>
                                    {/* Desktop Table View */}
                                    <div className="hidden md:block overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Invoice #</th>
                                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Client</th>
                                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Paid</th>
                                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                                                    <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">PDF</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {invoices.map((invoice) => (
                                                    <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-navy-900">
                                                            #{invoice.invoiceNumber}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                            {invoice.client?.firstName || 'Unknown'} {invoice.client?.lastName || 'Client'}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                                                                ${invoice.status === InvoiceStatus.PAID ? 'bg-green-100 text-green-800' :
                                                                    invoice.status === InvoiceStatus.OVERDUE ? 'bg-red-100 text-red-800' :
                                                                        'bg-gray-100 text-gray-800'}`}>
                                                                {invoice.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                                            ${invoice.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                                                            ${invoice.amountPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {new Date(invoice.issueDate).toLocaleDateString()}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                                            <button
                                                                onClick={() => handleViewInvoice(invoice.id)}
                                                                className="text-navy-600 hover:text-navy-900 transition-colors"
                                                                title="Download PDF"
                                                            >
                                                                <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                                </svg>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Mobile Card View */}
                                    <div className="md:hidden p-4 space-y-3">
                                        {invoices.map((invoice) => (
                                            <div key={invoice.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <div className="text-sm font-medium text-navy-900 mb-1">
                                                            #{invoice.invoiceNumber}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {invoice.client?.firstName || 'Unknown'} {invoice.client?.lastName || 'Client'}
                                                        </div>
                                                    </div>
                                                    <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full
                                                        ${invoice.status === InvoiceStatus.PAID ? 'bg-green-100 text-green-800' :
                                                            invoice.status === InvoiceStatus.OVERDUE ? 'bg-red-100 text-red-800' :
                                                                'bg-gray-100 text-gray-800'}`}>
                                                        {invoice.status}
                                                    </span>
                                                </div>
                                                <div className="space-y-2 text-sm mb-3">
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-500">Amount:</span>
                                                        <span className="font-medium text-gray-900">${invoice.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-500">Paid:</span>
                                                        <span className="font-medium text-green-600">${invoice.amountPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-500">Date:</span>
                                                        <span className="text-gray-700">{new Date(invoice.issueDate).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleViewInvoice(invoice.id)}
                                                    className="w-full px-4 py-2 bg-navy-600 text-white rounded-lg hover:bg-navy-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                    </svg>
                                                    Download PDF
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Payments Table */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="p-4 border-b border-gray-200 bg-gray-50">
                                <h3 className="text-lg font-semibold text-navy-900">All Payments (Receipts)</h3>
                                <p className="text-sm text-gray-600 mt-1">View and manage all project payment receipts</p>
                            </div>
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
        </div >
    );
}
