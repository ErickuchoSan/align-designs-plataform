'use client';

import { memo } from 'react';
import Modal from '@/components/ui/Modal';
import { formatCurrency } from '@/lib/utils/currency.utils';

interface InvoicePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Sample data for preview - this shows how the invoice will look
const SAMPLE_INVOICE = {
  invoiceNumber: 'INV-2026-PREVIEW',
  issueDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
  client: {
    name: 'John Smith',
    email: 'john.smith@example.com',
    phone: '+1 (555) 123-4567',
  },
  project: {
    name: 'Website Redesign Project',
  },
  items: [
    { description: 'UI/UX Design Services', amount: 2500 },
    { description: 'Frontend Development', amount: 3500 },
    { description: 'Backend Integration', amount: 2000 },
  ],
  subtotal: 8000,
  taxRate: 0,
  taxAmount: 0,
  totalAmount: 8000,
  amountPaid: 3000,
};

function InvoicePreviewModal({ isOpen, onClose }: InvoicePreviewModalProps) {
  const balanceDue = SAMPLE_INVOICE.totalAmount - SAMPLE_INVOICE.amountPaid;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Invoice Template Preview"
      size="xl"
    >
      <div className="space-y-4">
        {/* Preview Notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-sm text-amber-800 flex items-center gap-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span><strong>Preview Mode:</strong> This shows how invoices will look. Data shown is for demonstration only.</span>
          </p>
        </div>

        {/* Invoice Document */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="p-6 space-y-6">

            {/* Header */}
            <div className="flex justify-between border-b border-gray-200 pb-6">
              <div>
                <h2 className="text-xl font-bold text-navy-900">Align Designs</h2>
                <p className="text-gray-500 text-sm mt-1">Professional Design Services</p>
                <p className="text-gray-500 text-sm">contact@aligndesigns.com</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-navy-900">INVOICE</div>
                <div className="text-sm text-gray-500 mt-1">{SAMPLE_INVOICE.invoiceNumber}</div>
              </div>
            </div>

            {/* Bill To & Invoice Details */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Bill To</h3>
                <p className="font-medium text-gray-900">{SAMPLE_INVOICE.client.name}</p>
                <p className="text-sm text-gray-500">{SAMPLE_INVOICE.client.email}</p>
                <p className="text-sm text-gray-500">{SAMPLE_INVOICE.client.phone}</p>
              </div>
              <div className="text-right">
                <div className="space-y-1">
                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase">Issue Date: </span>
                    <span className="text-sm text-gray-900">{SAMPLE_INVOICE.issueDate}</span>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase">Due Date: </span>
                    <span className="text-sm text-gray-900">{SAMPLE_INVOICE.dueDate}</span>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase">Project: </span>
                    <span className="text-sm text-gray-900">{SAMPLE_INVOICE.project.name}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div>
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="text-right py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {SAMPLE_INVOICE.items.map((item, index) => (
                    <tr key={index}>
                      <td className="py-3 text-sm text-gray-900">{item.description}</td>
                      <td className="py-3 text-sm text-gray-900 text-right">{formatCurrency(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">{formatCurrency(SAMPLE_INVOICE.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax ({SAMPLE_INVOICE.taxRate}%)</span>
                  <span className="text-gray-900">{formatCurrency(SAMPLE_INVOICE.taxAmount)}</span>
                </div>
                <div className="flex justify-between font-bold text-base border-t border-gray-200 pt-2">
                  <span className="text-navy-900">Total</span>
                  <span className="text-navy-900">{formatCurrency(SAMPLE_INVOICE.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Amount Paid</span>
                  <span className="text-green-600">-{formatCurrency(SAMPLE_INVOICE.amountPaid)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t border-gray-200 pt-2">
                  <span className="text-navy-900">Balance Due</span>
                  <span className="text-navy-900">{formatCurrency(balanceDue)}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 pt-4 text-center text-xs text-gray-500">
              <p>Thank you for your business!</p>
              <p className="mt-1">Payment is due within 30 days of invoice date.</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Print Preview
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-white bg-navy-800 hover:bg-navy-700 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default memo(InvoicePreviewModal);
