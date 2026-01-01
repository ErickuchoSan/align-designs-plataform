'use client';

import { useState, useEffect, memo, useCallback } from 'react';
import { InvoicesService } from '@/services/invoices.service';
import { EmployeePaymentsService } from '@/services/employee-payments.service';
import { Invoice, InvoiceStatus } from '@/types/invoice';
import { EmployeePayment, EmployeePaymentStatus } from '@/types/employee-payment';
import { logger } from '@/lib/logger';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '@/lib/utils/currency.utils';
import GenerateInvoiceModal from '@/components/modals/GenerateInvoiceModal';
import PayEmployeeModal from '@/components/modals/PayEmployeeModal';
import UploadPaymentProofModal from '@/components/modals/UploadPaymentProofModal';

/**
 * Get status badge color based on invoice/payment status
 * Moved outside component for better performance (no recreation on renders)
 */
const getStatusColor = (status: InvoiceStatus | EmployeePaymentStatus): string => {
  switch (status) {
    case InvoiceStatus.PAID:
    case EmployeePaymentStatus.APPROVED:
      return 'bg-green-100 text-green-800';
    case EmployeePaymentStatus.PENDING:
    case InvoiceStatus.SENT:
    case InvoiceStatus.DRAFT:
      return 'bg-yellow-100 text-yellow-800';
    case InvoiceStatus.OVERDUE:
    case EmployeePaymentStatus.REJECTED:
      return 'bg-red-100 text-red-800';
    case InvoiceStatus.CANCELLED:
    case EmployeePaymentStatus.CANCELLED:
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-stone-100 text-stone-800';
  }
};

interface PaymentsStageContentProps {
  projectId: string;
  userRole: 'ADMIN' | 'CLIENT' | 'EMPLOYEE';
  userId: string;
  onGenerateInvoice?: () => void;
  onPayEmployee?: () => void;
  onUploadPaymentProof?: () => void;
}

/**
 * PaymentsStageContent Component
 *
 * Role-specific payment management interface:
 * - Admin: Can generate invoices, pay employees, approve/reject payments, see everything
 * - Client: Can upload payment proofs, see only their invoices
 * - Employee: Can see only their own payments (read-only)
 *
 * Optimized with memoization and external helper functions
 */
function PaymentsStageContent({
  projectId,
  userRole,
  userId,
  onGenerateInvoice,
  onPayEmployee,
  onUploadPaymentProof,
}: PaymentsStageContentProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [employeePayments, setEmployeePayments] = useState<EmployeePayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal States
  const [isGenerateInvoiceModalOpen, setIsGenerateInvoiceModalOpen] = useState(false);
  const [isPayEmployeeModalOpen, setIsPayEmployeeModalOpen] = useState(false);
  const [isUploadProofModalOpen, setIsUploadProofModalOpen] = useState(false);

  const loadPaymentData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Load invoices (Admin and Client only)
      if (userRole === 'ADMIN' || userRole === 'CLIENT') {
        const invoiceData = await InvoicesService.getByProject(projectId);
        setInvoices(invoiceData);
      }

      // Load employee payments (Admin and Employee only)
      if (userRole === 'ADMIN' || userRole === 'EMPLOYEE') {
        const paymentData = await EmployeePaymentsService.getByProject(projectId);
        setEmployeePayments(paymentData);
      }
    } catch (err: any) {
      logger.error('Error loading payment data:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to load payment data';
      setError(msg);
      toast.error('Failed to refresh payment data');
    } finally {
      setLoading(false);
    }
  }, [projectId, userRole]);

  useEffect(() => {
    loadPaymentData();
  }, [loadPaymentData]);

  const handleApprovePayment = useCallback(async (paymentId: string) => {
    if (!confirm('Are you sure you want to approve this payment?')) return;

    try {
      await EmployeePaymentsService.approve(paymentId);
      toast.success('Payment approved successfully');
      loadPaymentData();
    } catch (err: any) {
      logger.error('Error approving payment:', err);
      toast.error(err.response?.data?.message || 'Failed to approve payment');
    }
  }, [loadPaymentData]);

  const handleRejectPayment = useCallback(async (paymentId: string) => {
    const reason = prompt('Please enter a reason for rejection:');
    if (reason === null) return; // User cancelled
    if (reason.trim() === '') {
      toast.error('Rejection reason is required');
      return;
    }

    try {
      await EmployeePaymentsService.reject(paymentId, reason);
      toast.success('Payment rejected');
      loadPaymentData();
    } catch (err: any) {
      logger.error('Error rejecting payment:', err);
      toast.error(err.response?.data?.message || 'Failed to reject payment');
    }
  }, [loadPaymentData]);

  // Note: getStatusColor and formatCurrency are now defined outside the component for better performance

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-navy-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 p-4">
        <p className="text-sm font-medium text-red-800">{error}</p>
        <button
          onClick={loadPaymentData}
          className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Action Buttons - Role Specific */}
      <div className="flex items-center gap-3">
        {userRole === 'ADMIN' && (
          <>
            <button
              onClick={() => setIsGenerateInvoiceModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-navy-800 hover:bg-navy-700 text-white rounded-lg font-medium transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Generate Invoice
            </button>
            <button
              onClick={() => setIsPayEmployeeModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Pay Employee
            </button>
          </>
        )}

        {userRole === 'CLIENT' && (
          <button
            onClick={() => setIsUploadProofModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-navy-800 hover:bg-navy-700 text-white rounded-lg font-medium transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Upload Payment Proof
          </button>
        )}
      </div>

      {/* Client Invoices Section */}
      {(userRole === 'ADMIN' || userRole === 'CLIENT') && (
        <div className="bg-white rounded-lg border border-stone-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-navy-900">Client Invoices</h3>
            <span className="text-sm text-stone-600">{invoices.length} invoice(s)</span>
          </div>

          {invoices.length === 0 ? (
            <div className="text-center py-8">
              <svg className="w-16 h-16 mx-auto text-stone-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-stone-600">No invoices yet</p>
              {userRole === 'ADMIN' && (
                <p className="text-sm text-stone-500 mt-2">
                  Click "Generate Invoice" to create one
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-4 bg-stone-50 rounded-lg hover:bg-stone-100 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <p className="font-medium text-stone-900">Invoice #{invoice.invoiceNumber}</p>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                        {invoice.status}
                      </span>
                    </div>
                    <div className="text-sm text-stone-600 space-y-1">
                      <p>Amount: {formatCurrency(invoice.totalAmount)}</p>
                      <p>Paid: {formatCurrency(invoice.amountPaid)}</p>
                      <p>Due: {new Date(invoice.dueDate).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      className="p-2 text-stone-600 hover:text-navy-600 hover:bg-stone-200 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Employee Payments Section */}
      {(userRole === 'ADMIN' || userRole === 'EMPLOYEE') && (
        <div className="bg-white rounded-lg border border-stone-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-navy-900">
              {userRole === 'ADMIN' ? 'Employee Payments' : 'My Payments'}
            </h3>
            <span className="text-sm text-stone-600">{employeePayments.length} payment(s)</span>
          </div>

          {employeePayments.length === 0 ? (
            <div className="text-center py-8">
              <svg className="w-16 h-16 mx-auto text-stone-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-stone-600">No payments yet</p>
              {userRole === 'ADMIN' && (
                <p className="text-sm text-stone-500 mt-2">
                  Click "Pay Employee" to create one
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {employeePayments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 bg-stone-50 rounded-lg hover:bg-stone-100 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <p className="font-medium text-stone-900">
                        {userRole === 'ADMIN' && payment.employee
                          ? `${payment.employee.firstName} ${payment.employee.lastName}`
                          : 'Payment'}
                      </p>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                        {payment.status}
                      </span>
                    </div>
                    <div className="text-sm text-stone-600 space-y-1">
                      <p>Amount: {formatCurrency(Number(payment.amount))}</p>
                      <p>Method: {payment.paymentMethod}</p>
                      <p>Date: {new Date(payment.paymentDate).toLocaleDateString()}</p>
                      {payment.description && <p>Note: {payment.description}</p>}
                      {payment.rejectionReason && <p className="text-red-600">Rejection Reason: {payment.rejectionReason}</p>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* View Details Button */}
                    <button
                      className="p-2 text-stone-600 hover:text-navy-600 hover:bg-stone-200 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>

                    {/* Admin Actions */}
                    {userRole === 'ADMIN' && payment.status === EmployeePaymentStatus.PENDING && (
                      <>
                        <button
                          onClick={() => handleApprovePayment(payment.id)}
                          className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                          title="Approve Payment"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleRejectPayment(payment.id)}
                          className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          title="Reject Payment"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <GenerateInvoiceModal
        isOpen={isGenerateInvoiceModalOpen}
        onClose={() => setIsGenerateInvoiceModalOpen(false)}
        projectId={projectId}
        onSuccess={loadPaymentData}
      />
      <PayEmployeeModal
        isOpen={isPayEmployeeModalOpen}
        onClose={() => setIsPayEmployeeModalOpen(false)}
        projectId={projectId}
        onSuccess={loadPaymentData}
      />
      <UploadPaymentProofModal
        isOpen={isUploadProofModalOpen}
        onClose={() => setIsUploadProofModalOpen(false)}
        projectId={projectId}
        onSuccess={loadPaymentData}
        userId={userId}
      />
    </div>
  );
}

// Memoize component to prevent unnecessary re-renders
// Only re-renders when critical props change
export default memo(PaymentsStageContent);
