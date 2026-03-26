'use client';

import { memo } from 'react';
import { Invoice } from '@/types/invoice';
import InvoiceStatusBadge from './InvoiceStatusBadge';
import { formatDate } from '@/lib/date.utils';

interface InvoiceCardsProps {
  invoices: Invoice[];
  onViewInvoice: (invoiceId: string) => void;
  showClient?: boolean;
  dateField?: 'issueDate' | 'dueDate';
  dateLabel?: string;
  buttonText?: string;
  buttonIcon?: 'download' | 'view';
}

const DownloadIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

const ViewIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

function InvoiceCards({
  invoices,
  onViewInvoice,
  showClient = false,
  dateField = 'issueDate',
  dateLabel = 'Date',
  buttonText = 'Download PDF',
  buttonIcon = 'download',
}: Readonly<InvoiceCardsProps>) {
  const Icon = buttonIcon === 'download' ? DownloadIcon : ViewIcon;

  return (
    <div className="md:hidden p-4 space-y-3">
      {invoices.map((invoice) => (
        <div key={invoice.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <div>
              <div className="text-sm font-medium text-navy-900 mb-1">#{invoice.invoiceNumber}</div>
              {showClient && (
                <div className="text-xs text-gray-500">
                  {invoice.client?.firstName || 'Unknown'} {invoice.client?.lastName || 'Client'}
                </div>
              )}
            </div>
            <InvoiceStatusBadge status={invoice.status} className="py-0.5" />
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
              <span className="text-gray-500">{dateLabel}:</span>
              <span className="text-gray-700">{formatDate(invoice[dateField])}</span>
            </div>
          </div>
          <button
            onClick={() => onViewInvoice(invoice.id)}
            className="w-full px-4 py-2 bg-navy-600 text-white rounded-lg hover:bg-navy-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
          >
            <Icon />
            {buttonText}
          </button>
        </div>
      ))}
    </div>
  );
}

export default memo(InvoiceCards);
