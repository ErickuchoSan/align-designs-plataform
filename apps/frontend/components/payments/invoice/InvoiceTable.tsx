'use client';

import { memo } from 'react';
import { Invoice } from '@/types/invoice';
import InvoiceStatusBadge from './InvoiceStatusBadge';
import { formatDate } from '@/lib/date.utils';

interface InvoiceTableProps {
  invoices: Invoice[];
  onViewInvoice: (invoiceId: string) => void;
  showClient?: boolean;
  dateField?: 'issueDate' | 'dueDate';
  dateLabel?: string;
  actionLabel?: string;
  actionIcon?: 'download' | 'view';
}

const DownloadIcon = () => (
  <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

const ViewIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

function InvoiceTable({
  invoices,
  onViewInvoice,
  showClient = false,
  dateField = 'issueDate',
  dateLabel = 'Date',
  actionLabel = 'PDF',
  actionIcon = 'download',
}: Readonly<InvoiceTableProps>) {
  const Icon = actionIcon === 'download' ? DownloadIcon : ViewIcon;

  return (
    <div className="hidden md:block overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Invoice #</th>
            {showClient && (
              <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Client</th>
            )}
            <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Paid</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{dateLabel}</th>
            <th scope="col" className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">{actionLabel}</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {invoices.map((invoice) => (
            <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-navy-900">#{invoice.invoiceNumber}</td>
              {showClient && (
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {invoice.client?.firstName || 'Unknown'} {invoice.client?.lastName || 'Client'}
                </td>
              )}
              <td className="px-6 py-4 whitespace-nowrap">
                <InvoiceStatusBadge status={invoice.status} />
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                ${invoice.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                ${invoice.amountPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(invoice[dateField])}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                <button
                  onClick={() => onViewInvoice(invoice.id)}
                  className="text-navy-600 hover:text-navy-900 transition-colors"
                  title={actionIcon === 'download' ? 'Download PDF' : 'View Invoice'}
                  aria-label={`${actionIcon === 'download' ? 'Download PDF for' : 'View'} invoice ${invoice.invoiceNumber}`}
                >
                  <Icon />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default memo(InvoiceTable);
