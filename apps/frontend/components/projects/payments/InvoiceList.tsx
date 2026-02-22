'use client';

import { memo } from 'react';
import { Invoice, InvoiceStatus } from '@/types/invoice';
import { toast } from '@/lib/toast';
import { formatCurrency } from '@/lib/utils/currency.utils';
import PaymentEmptyState from './PaymentEmptyState';

const InvoiceIcon = () => (
  <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
    />
  </svg>
);

const getStatusColor = (status: InvoiceStatus): string => {
  switch (status) {
    case InvoiceStatus.PAID:
      return 'bg-green-100 text-green-800';
    case InvoiceStatus.SENT:
    case InvoiceStatus.DRAFT:
      return 'bg-yellow-100 text-yellow-800';
    case InvoiceStatus.OVERDUE:
      return 'bg-red-100 text-red-800';
    case InvoiceStatus.CANCELLED:
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-stone-100 text-stone-800';
  }
};

interface InvoiceListProps {
  invoices: Invoice[];
  isAdmin: boolean;
}

function InvoiceList({ invoices, isAdmin }: InvoiceListProps) {
  const handleViewInvoice = (invoice: Invoice) => {
    if (invoice.invoiceFileUrl) {
      window.open(invoice.invoiceFileUrl, '_blank');
    } else {
      toast.error('Invoice file not available');
    }
  };

  if (invoices.length === 0) {
    return (
      <PaymentEmptyState
        icon={<InvoiceIcon />}
        message="No invoices yet"
        hint={isAdmin ? 'Click "Generate Invoice" to create one' : undefined}
      />
    );
  }

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-hidden border border-stone-200 rounded-lg">
        <div className="max-h-96 overflow-y-auto overflow-x-auto">
          <table className="min-w-full divide-y divide-stone-200">
            <thead className="bg-stone-100 sticky top-0 z-10">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-stone-600 uppercase tracking-wider">
                  Invoice #
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-stone-600 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-stone-600 uppercase tracking-wider">
                  Amount
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-stone-600 uppercase tracking-wider">
                  Paid
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-stone-600 uppercase tracking-wider">
                  Due Date
                </th>
                <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-stone-600 uppercase tracking-wider">
                  Actions
                </th>
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
                      onClick={() => handleViewInvoice(invoice)}
                      className="inline-flex p-1.5 text-stone-600 hover:text-navy-600 hover:bg-stone-200 rounded-lg transition-colors"
                      aria-label={`View invoice ${invoice.invoiceNumber}`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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
          <div
            key={invoice.id}
            className="border border-stone-200 rounded-lg p-4 bg-white hover:bg-stone-50 transition-colors"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="text-sm font-medium text-stone-900">#{invoice.invoiceNumber}</div>
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
              onClick={() => handleViewInvoice(invoice)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-stone-600 hover:text-navy-600 hover:bg-stone-100 rounded-lg transition-colors border border-stone-200"
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
  );
}

export default memo(InvoiceList);
