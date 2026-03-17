'use client';

import { memo, useState } from 'react';
import PaymentHistoryTable from '@/components/payments/PaymentHistoryTable';
import RecordPaymentModal from '@/components/payments/RecordPaymentModal';
import AdminPaymentReviewModal from '@/components/payments/AdminPaymentReviewModal';
import { Payment, PaymentType } from '@/types/payments';
import { Invoice, InvoiceStatus } from '@/types/invoice';
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

const getInvoiceStatusBadgeClass = (status: InvoiceStatus): string => {
  if (status === InvoiceStatus.PAID) return 'bg-green-100 text-green-800';
  if (status === InvoiceStatus.OVERDUE) return 'bg-red-100 text-red-800';
  return 'bg-gray-100 text-gray-800';
};

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
          <div className="text-xs text-gray-400 mt-1">{invoices.length} invoices generated</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-500 mb-1">Pending Approval</div>
          <div className="text-2xl font-bold text-yellow-600">
            {payments.filter((p) => p.status === 'PENDING_APPROVAL').length}
          </div>
          <div className="text-xs text-gray-400 mt-1">payments waiting</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-500 mb-1">Total Payments</div>
          <div className="text-2xl font-bold text-navy-900">{payments.length}</div>
          <div className="text-xs text-gray-400 mt-1">all time</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => openModal(PaymentType.INITIAL_PAYMENT)}
          className="px-4 py-2 bg-navy-600 text-white rounded-lg hover:bg-navy-700 transition-colors font-medium shadow-sm flex items-center gap-2"
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-semibold text-navy-900">Project Invoices</h3>
        </div>
        {invoices.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No invoices generated yet.</div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Invoice #</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Client</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Paid</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                    <th scope="col" className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">PDF</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-navy-900">#{invoice.invoiceNumber}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {invoice.client?.firstName || 'Unknown'} {invoice.client?.lastName || 'Client'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getInvoiceStatusBadgeClass(invoice.status)}`}>
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
                          onClick={() => onViewInvoice(invoice.id)}
                          className="text-navy-600 hover:text-navy-900 transition-colors"
                          title="Download PDF"
                          aria-label={`Download PDF for invoice ${invoice.invoiceNumber}`}
                        >
                          <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden p-4 space-y-3">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="text-sm font-medium text-navy-900 mb-1">#{invoice.invoiceNumber}</div>
                      <div className="text-xs text-gray-500">
                        {invoice.client?.firstName || 'Unknown'} {invoice.client?.lastName || 'Client'}
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getInvoiceStatusBadgeClass(invoice.status)}`}>
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
                    onClick={() => onViewInvoice(invoice.id)}
                    className="w-full px-4 py-2 bg-navy-600 text-white rounded-lg hover:bg-navy-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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
