'use client';

import { useState, useEffect, memo, useCallback } from 'react';
import { InvoicesService } from '@/services/invoices.service';
import { EmployeePaymentsService } from '@/services/employee-payments.service';
import { PaymentsService } from '@/services/payments.service';
import { Invoice, InvoiceStatus } from '@/types/invoice';
import { EmployeePayment, EmployeePaymentStatus } from '@/types/employee-payment';
import { Payment } from '@/types/payments';
import { logger } from '@/lib/logger';
import { toast } from 'react-hot-toast';
import { handleApiError } from '@/lib/errors';
import { formatCurrency } from '@/lib/utils/currency.utils';
import ApproveEmployeePaymentModal from '@/components/modals/ApproveEmployeePaymentModal';
import AdminPaymentReviewModal from '@/components/payments/AdminPaymentReviewModal';
import PaymentReceiptModal from '@/components/payments/PaymentReceiptModal';
import ConfirmModal from '@/components/modals/ConfirmModal';
import Modal from '@/components/ui/Modal';
import { ButtonLoader } from '@/components/ui/Loader';

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
  onRefresh?: () => void;
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
  onRefresh,
}: PaymentsStageContentProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [employeePayments, setEmployeePayments] = useState<EmployeePayment[]>([]);
  const [clientPayments, setClientPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal States
  const [reviewingPayment, setReviewingPayment] = useState<Payment | null>(null);
  const [confirmApprovePayment, setConfirmApprovePayment] = useState<string | null>(null);
  const [approvingPayment, setApprovingPayment] = useState(false);
  const [rejectingPaymentId, setRejectingPaymentId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectingPayment, setRejectingPayment] = useState(false);

  // View Only Modal State
  const [viewingPayment, setViewingPayment] = useState<Payment | EmployeePayment | null>(null);

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

      // Load client payments (Admin and Client)
      if (userRole === 'ADMIN' || userRole === 'CLIENT') {
        const allPayments = await PaymentsService.findAllByProject(projectId);
        // Filter only client payments (INITIAL_PAYMENT or INVOICE type)
        const clientPays = allPayments.filter(p =>
          p.type === 'INITIAL_PAYMENT' || p.type === 'INVOICE'
        );
        setClientPayments(clientPays);
      }
    } catch (err: any) {
      logger.error('Error loading payment data:', err);
      const msg = handleApiError(err, 'Failed to load payment data'); // Use util for consistency
      setError(msg);
      toast.error('Failed to refresh payment data'); // Keep toast simple or sync? Let's keep it simple as error is shown in UI.
    } finally {
      setLoading(false);
    }
  }, [projectId, userRole]);

  useEffect(() => {
    loadPaymentData();
  }, [loadPaymentData]);

  const handleApprovePayment = useCallback((paymentId: string) => {
    setConfirmApprovePayment(paymentId);
  }, []);

  const confirmApprove = useCallback(async (file: File) => {
    if (!confirmApprovePayment) return;

    setApprovingPayment(true);
    try {
      await EmployeePaymentsService.approve(confirmApprovePayment, file);
      toast.success('Payment approved successfully');
      setConfirmApprovePayment(null);
      loadPaymentData();
    } catch (err: any) {
      logger.error('Error approving payment:', err);
      toast.error(handleApiError(err, 'Failed to approve payment'));
    } finally {
      setApprovingPayment(false);
    }
  }, [confirmApprovePayment, loadPaymentData]);

  const handleRejectPayment = useCallback((paymentId: string) => {
    setRejectingPaymentId(paymentId);
    setRejectionReason('');
  }, []);

  const confirmReject = useCallback(async () => {
    if (!rejectingPaymentId) return;

    if (rejectionReason.trim() === '') {
      toast.error('Rejection reason is required');
      return;
    }

    setRejectingPayment(true);
    try {
      await EmployeePaymentsService.reject(rejectingPaymentId, rejectionReason);
      toast.success('Payment rejected');
      setRejectingPaymentId(null);
      setRejectionReason('');
      loadPaymentData();
    } catch (err: any) {
      logger.error('Error rejecting payment:', err);
      toast.error(handleApiError(err, 'Failed to reject payment'));
    } finally {
      setRejectingPayment(false);
    }
  }, [rejectingPaymentId, rejectionReason, loadPaymentData]);

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
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
        {userRole === 'ADMIN' && (
          <>
            <button
              onClick={onGenerateInvoice}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-navy-800 hover:bg-navy-700 text-white rounded-lg font-medium transition-colors text-sm sm:text-base"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="whitespace-nowrap">Generate Invoice</span>
            </button>
            <button
              onClick={onPayEmployee}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors text-sm sm:text-base"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="whitespace-nowrap">Pay Employee</span>
            </button>
          </>
        )}

        {userRole === 'CLIENT' && (
          <button
            onClick={onUploadPaymentProof}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-navy-800 hover:bg-navy-700 text-white rounded-lg font-medium transition-colors text-sm sm:text-base"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span className="whitespace-nowrap">Upload Payment Proof</span>
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
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-hidden border border-stone-200 rounded-lg">
                <div className="max-h-96 overflow-y-auto overflow-x-auto">
                  <table className="min-w-full divide-y divide-stone-200">
                    <thead className="bg-stone-100 sticky top-0 z-10">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-stone-600 uppercase tracking-wider">Invoice #</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-stone-600 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-stone-600 uppercase tracking-wider">Amount</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-stone-600 uppercase tracking-wider">Paid</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-stone-600 uppercase tracking-wider">Due Date</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-stone-600 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-stone-200">
                      {invoices.map((invoice) => (
                        <tr key={invoice.id} className="hover:bg-stone-50 transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-stone-900">
                            #{invoice.invoiceNumber}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                              {invoice.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-stone-900 font-medium">
                            {formatCurrency(invoice.totalAmount)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-green-600 font-medium">
                            {formatCurrency(invoice.amountPaid)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-stone-600">
                            {new Date(invoice.dueDate).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-center">
                            <button
                              onClick={() => {
                                if (invoice.invoiceFileUrl) {
                                  window.open(invoice.invoiceFileUrl, '_blank');
                                } else {
                                  toast.error('Invoice file not available');
                                }
                              }}
                              className="inline-flex p-1.5 text-stone-600 hover:text-navy-600 hover:bg-stone-200 rounded-lg transition-colors"
                              title="View Invoice"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                {invoices.map((invoice) => (
                  <div key={invoice.id} className="border border-stone-200 rounded-lg p-4 bg-white hover:bg-stone-50 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div className="text-sm font-medium text-stone-900">
                        #{invoice.invoiceNumber}
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                        {invoice.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                      <div>
                        <div className="text-stone-500">Amount</div>
                        <div className="text-sm text-stone-900 font-medium">{formatCurrency(invoice.totalAmount)}</div>
                      </div>
                      <div>
                        <div className="text-stone-500">Paid</div>
                        <div className="text-sm text-green-600 font-medium">{formatCurrency(invoice.amountPaid)}</div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-stone-500">Due Date</div>
                        <div className="text-sm text-stone-600">{new Date(invoice.dueDate).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (invoice.invoiceFileUrl) {
                          window.open(invoice.invoiceFileUrl, '_blank');
                        } else {
                          toast.error('Invoice file not available');
                        }
                      }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 text-stone-600 hover:text-navy-600 hover:bg-stone-100 rounded-lg transition-colors border border-stone-200"
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
      )}

      {/* Client Payments (My Payments) - Client View */}
      {userRole === 'CLIENT' && (
        <div className="bg-white rounded-lg border border-stone-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-navy-900">My Payments</h3>
            <span className="text-sm text-stone-600">{clientPayments.length} payment(s)</span>
          </div>

          {clientPayments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-stone-600">No payments made yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {clientPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 bg-stone-50 rounded-lg border border-stone-200"
                >
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <p className="font-medium text-stone-900">
                        {payment.type === 'INITIAL_PAYMENT' ? 'Initial Payment' : 'Invoice Payment'}
                      </p>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${payment.status === 'PENDING_APPROVAL' ? 'bg-yellow-100 text-yellow-800' :
                        payment.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                          payment.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                        }`}>
                        {payment.status}
                      </span>
                    </div>
                    <div className="text-sm text-stone-600 space-y-1">
                      <p className="font-semibold text-green-600">
                        ${Number(payment.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </p>
                      <p>Method: {payment.paymentMethod}</p>
                      <p>Date: {new Date(payment.paymentDate).toLocaleDateString()}</p>
                      {payment.notes && <p>Note: {payment.notes}</p>}
                      {payment.rejectionReason && <p className="text-red-600">Rejection Reason: {payment.rejectionReason}</p>}
                    </div>
                  </div>
                  {(payment.receiptFileUrl) && (
                    <button
                      onClick={() => {
                        // Temporarily cast Payment to EmployeePayment-like object for viewing if needed
                        // Or ensure PaymentReceiptModal handles Payment type.
                        // setViewingPayment only accepts Payment | EmployeePayment
                        setViewingPayment(payment);
                      }}
                      className="p-2 text-stone-600 hover:text-navy-600 hover:bg-stone-200 rounded-lg transition-colors"
                      title="View Receipt"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Client Payments Pending Approval - Admin Only */}
      {userRole === 'ADMIN' && (
        <div className="bg-white rounded-lg border border-stone-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-navy-900">Client Payments Pending Approval</h3>
            <span className="text-sm text-stone-600">
              {clientPayments.filter(p => p.status === 'PENDING_APPROVAL').length} pending
            </span>
          </div>

          {clientPayments.filter(p => p.status === 'PENDING_APPROVAL').length === 0 ? (
            <div className="text-center py-8">
              <svg className="w-16 h-16 mx-auto text-stone-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-stone-600">No payments pending approval</p>
              <p className="text-sm text-stone-500 mt-2">
                All client payments have been reviewed
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {clientPayments
                .filter(p => p.status === 'PENDING_APPROVAL')
                .map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <p className="font-medium text-stone-900">
                          {payment.type === 'INITIAL_PAYMENT' ? 'Initial Payment' : 'Invoice Payment'}
                        </p>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          PENDING APPROVAL
                        </span>
                      </div>
                      <div className="text-sm text-stone-600 space-y-1">
                        <p className="font-semibold text-lg text-green-600">
                          Amount: ${Number(payment.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                        <p>Method: {payment.paymentMethod}</p>
                        <p>Date: {new Date(payment.paymentDate).toLocaleDateString()}</p>
                        {/* Show description for EmployeePayment (which has description) or notes for Payment */}
                        {'description' in payment && (payment as any).description && <p>Note: {(payment as any).description}</p>}
                        {'notes' in payment && (payment as any).notes && <p>Note: {(payment as any).notes}</p>}
                        {payment.invoiceId && <p className="text-navy-600">Linked to Invoice</p>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setReviewingPayment(payment)}
                        className="px-4 py-2 bg-navy-600 hover:bg-navy-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Review Payment
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
                    {/* View Details Button - Show if approved or has receipt */}
                    {(payment.status === 'APPROVED' || payment.receiptFileId || payment.receiptFile) && (
                      <button
                        onClick={() => setViewingPayment(payment)}
                        className="p-2 text-stone-600 hover:text-navy-600 hover:bg-stone-200 rounded-lg transition-colors"
                        title="View Receipt"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                    )}

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

      {reviewingPayment && (
        <AdminPaymentReviewModal
          isOpen={true}
          onClose={() => setReviewingPayment(null)}
          payment={reviewingPayment}
          onSuccess={async () => {
            setReviewingPayment(null);
            // First reload payment data
            await loadPaymentData();
            // Then notify parent to refresh project data
            if (onRefresh) {
              await onRefresh();
            }
          }}
        />
      )}

      {/* View Payment Details Modal (Read Only) */}
      <PaymentReceiptModal
        isOpen={!!viewingPayment}
        onClose={() => setViewingPayment(null)}
        payment={viewingPayment || undefined}
      />

      {/* Confirm Approve Payment Modal */}
      <ApproveEmployeePaymentModal
        isOpen={!!confirmApprovePayment}
        onClose={() => setConfirmApprovePayment(null)}
        onConfirm={confirmApprove}
        isLoading={approvingPayment}
      />

      {/* Reject Payment Modal */}
      {rejectingPaymentId && (
        <Modal isOpen={true} onClose={() => setRejectingPaymentId(null)} title="Reject Payment" size="sm">
          <div className="space-y-4">
            <p className="text-gray-700">Please provide a reason for rejecting this payment:</p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              rows={4}
              placeholder="Enter rejection reason..."
              autoFocus
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setRejectingPaymentId(null)}
                disabled={rejectingPayment}
                className="px-5 py-2.5 text-sm font-medium text-gray-800 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={confirmReject}
                disabled={rejectingPayment || !rejectionReason.trim()}
                className="px-5 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none min-w-[100px] flex items-center justify-center"
              >
                {rejectingPayment ? <ButtonLoader /> : 'Reject Payment'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// Memoize component to prevent unnecessary re-renders
// Only re-renders when critical props change
export default memo(PaymentsStageContent);
