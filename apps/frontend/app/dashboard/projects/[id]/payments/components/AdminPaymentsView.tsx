'use client';

import { memo, useState } from 'react';
import PaymentHistoryTable from '@/components/payments/PaymentHistoryTable';
import RecordPaymentModal from '@/components/payments/RecordPaymentModal';
import AdminPaymentReviewModal from '@/components/payments/AdminPaymentReviewModal';
import { InvoiceTable, InvoiceCards } from '@/components/payments/invoice';
import { Payment, PaymentType } from '@/types/payments';
import { Invoice } from '@/types/invoice';
import { Project } from '@/types';

interface AdminPaymentsViewProps {
  projectId: string;
  project: Project | null;
  payments: Payment[];
  invoices: Invoice[];
  isLoading: boolean;
  remainingAmount: number;
  onViewInvoice: (invoiceId: string) => void;
  onRefresh: () => void;
}

function AdminPaymentsView({
  projectId,
  project,
  payments,
  invoices,
  isLoading,
  remainingAmount,
  onViewInvoice,
  onRefresh,
}: Readonly<AdminPaymentsViewProps>) {
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [paymentModalType, setPaymentModalType] = useState<PaymentType>(PaymentType.INITIAL_PAYMENT);

  const openModal = (type: PaymentType) => {
    setPaymentModalType(type);
    setIsRecordModalOpen(true);
  };

  const handleViewReceipt = (payment: Payment) => {
    setSelectedPayment(payment);
    setIsReviewModalOpen(true);
  };

  return (
    <>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4">
          <div className="text-sm text-[#6B6A65] mb-1">Amount Paid</div>
          <div className="text-2xl font-bold text-green-600">
            ${Number(project?.amountPaid || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          {project?.initialAmountRequired && (
            <div className="text-xs text-[#6B6A65] mt-1">
              of ${Number(project.initialAmountRequired).toLocaleString()} required
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl p-4">
          <div className="text-sm text-[#6B6A65] mb-1">Total Invoiced</div>
          <div className="text-2xl font-bold text-[#1B1C1A]">
            ${invoices.reduce((sum, i) => sum + i.totalAmount, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-[#6B6A65] mt-1">{invoices.length} invoices generated</div>
        </div>

        <div className="bg-white rounded-xl p-4">
          <div className="text-sm text-[#6B6A65] mb-1">Pending Approval</div>
          <div className="text-2xl font-bold text-yellow-600">
            {payments.filter((p) => p.status === 'PENDING_APPROVAL').length}
          </div>
          <div className="text-xs text-[#6B6A65] mt-1">payments waiting</div>
        </div>

        <div className="bg-white rounded-xl p-4">
          <div className="text-sm text-[#6B6A65] mb-1">Total Payments</div>
          <div className="text-2xl font-bold text-[#1B1C1A]">{payments.length}</div>
          <div className="text-xs text-[#6B6A65] mt-1">all time</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => openModal(PaymentType.INITIAL_PAYMENT)}
          className="px-4 py-2 bg-gradient-to-br from-[#755B00] to-[#C9A84C] text-white rounded-lg hover:brightness-95 transition-colors font-medium flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Record Income
        </button>
        <button
          onClick={() => openModal(PaymentType.EMPLOYEE_PAYMENT)}
          className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium shadow-sm flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
          Pay Employee
        </button>
      </div>

      {/* Invoices Table for Admin */}
      <div className="bg-white rounded-xl overflow-hidden mb-6">
        <div className="p-4 border-b border-[#D0C5B2]/20 bg-[#F5F4F0]">
          <h3 className="text-lg font-semibold text-[#1B1C1A]">Project Invoices</h3>
        </div>
        {invoices.length === 0 ? (
          <div className="p-8 text-center text-[#6B6A65]">No invoices generated yet.</div>
        ) : (
          <>
            <InvoiceTable
              invoices={invoices}
              onViewInvoice={onViewInvoice}
              showClient={true}
              dateField="issueDate"
              dateLabel="Date"
            />
            <InvoiceCards
              invoices={invoices}
              onViewInvoice={onViewInvoice}
              showClient={true}
              dateField="issueDate"
              dateLabel="Date"
            />
          </>
        )}
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl overflow-hidden">
        <div className="p-4 border-b border-[#D0C5B2]/20 bg-[#F5F4F0]">
          <h3 className="text-lg font-semibold text-[#1B1C1A]">All Payments (Receipts)</h3>
          <p className="text-sm text-[#6B6A65] mt-1">View and manage all project payment receipts</p>
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
        onSuccess={onRefresh}
        initialAmount={remainingAmount}
        defaultType={paymentModalType}
      />

      {selectedPayment && (
        <AdminPaymentReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          payment={selectedPayment}
          onSuccess={onRefresh}
        />
      )}
    </>
  );
}

export default memo(AdminPaymentsView);
