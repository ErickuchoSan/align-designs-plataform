'use client';

import { useState, memo } from 'react';
import { EmployeePayment } from '@/types/employee-payment';
import { Payment } from '@/types/payments';
import Modal from '@/components/ui/Modal';
import { ButtonLoader } from '@/components/ui/Loader';
import ApproveEmployeePaymentModal from '@/components/modals/ApproveEmployeePaymentModal';
import AdminPaymentReviewModal from '@/components/payments/AdminPaymentReviewModal';
import PaymentReceiptModal from '@/components/payments/PaymentReceiptModal';
import { cn, TEXTAREA_BASE } from '@/lib/styles';

import { usePaymentsStage } from './hooks/usePaymentsStage';
import PaymentActions from './PaymentActions';
import InvoiceList from './InvoiceList';
import ClientPaymentsList, { PendingPaymentsList } from './ClientPaymentsList';
import EmployeePaymentsList from './EmployeePaymentsList';

interface PaymentsStageContentProps {
  projectId: string;
  userRole: 'ADMIN' | 'CLIENT' | 'EMPLOYEE';
  userId: string;
  onGenerateInvoice?: () => void;
  onPayEmployee?: () => void;
  onUploadPaymentProof?: () => void;
  onRefresh?: () => void;
}

function PaymentsStageContent({
  projectId,
  userRole,
  onGenerateInvoice,
  onPayEmployee,
  onUploadPaymentProof,
  onRefresh,
}: PaymentsStageContentProps) {
  // Data hook
  const {
    invoices,
    employeePayments,
    clientPayments,
    loading,
    error,
    refetch,
    approvePayment,
    rejectPayment,
    approvingPayment,
    rejectingPayment,
  } = usePaymentsStage({ projectId, userRole });

  // Modal States
  const [reviewingPayment, setReviewingPayment] = useState<Payment | null>(null);
  const [confirmApprovePayment, setConfirmApprovePayment] = useState<string | null>(null);
  const [rejectingPaymentId, setRejectingPaymentId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [viewingPayment, setViewingPayment] = useState<Payment | EmployeePayment | null>(null);

  // Handlers
  const handleConfirmApprove = async (file: File) => {
    if (!confirmApprovePayment) return;
    const success = await approvePayment(confirmApprovePayment, file);
    if (success) setConfirmApprovePayment(null);
  };

  const handleConfirmReject = async () => {
    if (!rejectingPaymentId) return;
    const success = await rejectPayment(rejectingPaymentId, rejectionReason);
    if (success) {
      setRejectingPaymentId(null);
      setRejectionReason('');
    }
  };

  const handleReviewSuccess = async () => {
    setReviewingPayment(null);
    await refetch();
    if (onRefresh) await onRefresh();
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-navy-900" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 p-4" role="alert">
        <p className="text-sm font-medium text-red-800">{error}</p>
        <button
          onClick={refetch}
          className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
        >
          Try Again
        </button>
      </div>
    );
  }

  const isAdmin = userRole === 'ADMIN';
  const isClient = userRole === 'CLIENT';
  const isEmployee = userRole === 'EMPLOYEE';

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <PaymentActions
        userRole={userRole}
        onGenerateInvoice={onGenerateInvoice}
        onPayEmployee={onPayEmployee}
        onUploadPaymentProof={onUploadPaymentProof}
      />

      {/* Client Invoices Section */}
      {(isAdmin || isClient) && (
        <section className="bg-white rounded-lg border border-stone-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-navy-900">Client Invoices</h3>
            <span className="text-sm text-stone-600">{invoices.length} invoice(s)</span>
          </div>
          <InvoiceList invoices={invoices} isAdmin={isAdmin} />
        </section>
      )}

      {/* Client Payments - Client View */}
      {isClient && (
        <section className="bg-white rounded-lg border border-stone-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-navy-900">My Payments</h3>
            <span className="text-sm text-stone-600">{clientPayments.length} payment(s)</span>
          </div>
          <ClientPaymentsList payments={clientPayments} onViewReceipt={setViewingPayment} />
        </section>
      )}

      {/* Pending Payments - Admin View */}
      {isAdmin && (
        <section className="bg-white rounded-lg border border-stone-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-navy-900">Client Payments Pending Approval</h3>
            <span className="text-sm text-stone-600">
              {clientPayments.filter((p) => p.status === 'PENDING_APPROVAL').length} pending
            </span>
          </div>
          <PendingPaymentsList payments={clientPayments} onReviewPayment={setReviewingPayment} />
        </section>
      )}

      {/* Employee Payments Section */}
      {(isAdmin || isEmployee) && (
        <section className="bg-white rounded-lg border border-stone-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-navy-900">
              {isAdmin ? 'Employee Payments' : 'My Payments'}
            </h3>
            <span className="text-sm text-stone-600">{employeePayments.length} payment(s)</span>
          </div>
          <EmployeePaymentsList
            payments={employeePayments}
            userRole={userRole as 'ADMIN' | 'EMPLOYEE'}
            onViewReceipt={setViewingPayment}
            onApprove={isAdmin ? setConfirmApprovePayment : undefined}
            onReject={isAdmin ? setRejectingPaymentId : undefined}
          />
        </section>
      )}

      {/* Modals */}
      {reviewingPayment && (
        <AdminPaymentReviewModal
          isOpen={true}
          onClose={() => setReviewingPayment(null)}
          payment={reviewingPayment}
          onSuccess={handleReviewSuccess}
        />
      )}

      <PaymentReceiptModal
        isOpen={!!viewingPayment}
        onClose={() => setViewingPayment(null)}
        payment={viewingPayment || undefined}
      />

      <ApproveEmployeePaymentModal
        isOpen={!!confirmApprovePayment}
        onClose={() => setConfirmApprovePayment(null)}
        onConfirm={handleConfirmApprove}
        isLoading={approvingPayment}
      />

      {rejectingPaymentId && (
        <Modal isOpen={true} onClose={() => setRejectingPaymentId(null)} title="Reject Payment" size="sm">
          <div className="space-y-4">
            <p className="text-gray-700">Please provide a reason for rejecting this payment:</p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className={cn(TEXTAREA_BASE, 'focus:ring-red-500 focus:border-red-500')}
              rows={4}
              placeholder="Enter rejection reason..."
              autoFocus
              aria-label="Rejection reason"
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
                onClick={handleConfirmReject}
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

export default memo(PaymentsStageContent);
