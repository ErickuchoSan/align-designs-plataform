'use client';

import { memo, useState } from 'react';
import PaymentHistoryTable from '@/components/payments/PaymentHistoryTable';
import ClientPaymentUploadModal from '@/components/payments/ClientPaymentUploadModal';
import { InvoiceTable, InvoiceCards } from '@/components/payments/invoice';
import { Payment } from '@/types/payments';
import { Invoice } from '@/types/invoice';
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
            <InvoiceTable
              invoices={invoices}
              onViewInvoice={onViewInvoice}
              dateField="dueDate"
              dateLabel="Due Date"
              actionLabel="Actions"
              actionIcon="view"
            />
            <InvoiceCards
              invoices={invoices}
              onViewInvoice={onViewInvoice}
              dateField="dueDate"
              dateLabel="Due Date"
              buttonText="View Invoice"
              buttonIcon="view"
            />
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
