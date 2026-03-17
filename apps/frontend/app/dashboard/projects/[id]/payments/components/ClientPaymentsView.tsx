'use client';

import { memo, useState } from 'react';
import PaymentHistoryTable from '@/components/payments/PaymentHistoryTable';
import ClientPaymentUploadModal from '@/components/payments/ClientPaymentUploadModal';
import { Payment } from '@/types/payments';
import { Invoice, InvoiceStatus } from '@/types/invoice';
import { Project } from '@/types';

interface ClientPaymentsViewProps {
  projectId: string;
  project: Project | null;
  payments: Payment[];
  invoices: Invoice[];
  isLoading: boolean;
  pendingAmount: number;
  remainingAmount: number;
  isFullyCovered: boolean;
  onViewInvoice: (invoiceId: string) => void;
  onRefresh: () => void;
}

const getInvoiceStatusBadgeClass = (status: InvoiceStatus): string => {
  if (status === InvoiceStatus.PAID) return 'bg-green-100 text-green-800';
  if (status === InvoiceStatus.OVERDUE) return 'bg-red-100 text-red-800';
  return 'bg-gray-100 text-gray-800';
};

function ClientPaymentsView({
  projectId,
  project,
  payments,
  invoices,
  isLoading,
  pendingAmount,
  remainingAmount,
  isFullyCovered,
  onViewInvoice,
  onRefresh,
}: Readonly<ClientPaymentsViewProps>) {
  const [isClientUploadModalOpen, setIsClientUploadModalOpen] = useState(false);

  return (
    <>
      {/* Initial Payment Progress Card */}
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
              <div className="text-2xl font-bold text-amber-600">
                ${remainingAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4 overflow-hidden relative">
            <div
              className="bg-green-600 h-3 absolute left-0 top-0 transition-all duration-300"
              style={{ width: `${(Number(project?.amountPaid || 0) / Number(project?.initialAmountRequired || 1)) * 100}%` }}
            />
            <div
              className="bg-yellow-400 h-3 absolute top-0 transition-all duration-300 opacity-80 striped-bar"
              style={{
                left: `${(Number(project?.amountPaid || 0) / Number(project?.initialAmountRequired || 1)) * 100}%`,
                width: `${(pendingAmount / Number(project?.initialAmountRequired || 1)) * 100}%`,
              }}
            />
          </div>

          {pendingAmount > 0 && (
            <p className="text-sm text-yellow-600 mb-4 font-medium">
              <span className="inline-block w-2 h-2 rounded-full bg-yellow-400 mr-2" aria-hidden="true"></span>
              ${pendingAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} pending approval
            </p>
          )}

          <button
            onClick={() => setIsClientUploadModalOpen(true)}
            className="w-full px-4 py-3 bg-navy-600 text-white rounded-lg hover:bg-navy-700 transition-colors font-medium shadow-sm flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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
          <div className="text-sm text-stone-500">{invoices.length} invoice(s)</div>
        </div>

        {invoices.length === 0 ? (
          <div className="p-8 text-center text-stone-500">No invoices found for this project.</div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Invoice #</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Paid</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Due Date</th>
                    <th scope="col" className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-navy-900">#{invoice.invoiceNumber}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getInvoiceStatusBadgeClass(invoice.status)}`}>
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
                          onClick={() => onViewInvoice(invoice.id)}
                          className="text-navy-600 hover:text-navy-900 transition-colors"
                          title="Download Invoice"
                          aria-label={`Download invoice ${invoice.invoiceNumber}`}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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

            {/* Mobile Cards */}
            <div className="md:hidden p-4 space-y-3">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div className="text-sm font-medium text-navy-900">#{invoice.invoiceNumber}</div>
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
                      <span className="text-gray-500">Due Date:</span>
                      <span className="text-gray-700">{new Date(invoice.dueDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => onViewInvoice(invoice.id)}
                    className="w-full px-4 py-2 bg-navy-600 text-white rounded-lg hover:bg-navy-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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
        <PaymentHistoryTable payments={payments} isLoading={isLoading} isAdmin={false} />
      </div>

      <ClientPaymentUploadModal
        isOpen={isClientUploadModalOpen}
        onClose={() => setIsClientUploadModalOpen(false)}
        projectId={projectId}
        onSuccess={onRefresh}
        suggestedAmount={remainingAmount}
        maxAmount={remainingAmount}
      />
    </>
  );
}

export default memo(ClientPaymentsView);
