'use client';

import { memo, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { formatCurrency } from '@/lib/utils/currency.utils';
import { formatDate, addDays } from '@/lib/date.utils';

interface InvoicePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Print styles injected when component mounts
const PRINT_STYLES = `
@media print {
  /* Hide everything except invoice content */
  body > *:not(#invoice-print-content) {
    display: none !important;
  }

  /* Reset body styles for printing */
  body {
    overflow: visible !important;
    height: auto !important;
  }

  /* Show only the invoice container */
  #invoice-print-content {
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
    width: 100% !important;
    height: auto !important;
    overflow: visible !important;
    background: white !important;
  }

  /* Hide non-printable elements */
  .no-print {
    display: none !important;
  }

  /* Page break between invoice pages */
  .print-page {
    page-break-after: always;
    page-break-inside: avoid;
    margin: 0 !important;
    padding: 20px !important;
    border: none !important;
    box-shadow: none !important;
    border-radius: 0 !important;
  }

  .print-page:last-child {
    page-break-after: auto;
  }
}
`;

// Color scheme matching PDF invoice design
const COLORS = {
  primary: '#D4A843', // Golden/Orange for headers
  text: '#333333',
  lightText: '#666666',
  paid: '#C53030', // Red for PAID stamp
  border: '#E5E5E5',
  white: '#FFFFFF',
};

// Company information
const COMPANY_INFO = {
  name: 'Align Designs LLC',
  phone: '(956)534-4110',
  email: 'Alfonso21guz@gmail.com',
};

// Sample data for preview - this shows how the invoice will look
const SAMPLE_INVOICE = {
  invoiceNumber: 'INV-2026-PREVIEW',
  issueDate: formatDate(new Date(), 'short'),
  dueDate: formatDate(addDays(new Date(), 30), 'short'),
  client: {
    name: 'Danaby Rentals Inc.',
    company: 'Danaby Rentals Inc.',
  },
  project: {
    name: 'Architectural Design Package',
  },
  description: 'Architectural Design Package\n\nProject services as agreed.',
  subtotal: 8000,
  totalAmount: 8000,
  amountPaid: 3000,
  status: 'PENDING' as 'PENDING' | 'PAID',
};

function InvoicePreviewModal({ isOpen, onClose }: Readonly<InvoicePreviewModalProps>) {
  const balanceDue = SAMPLE_INVOICE.totalAmount - SAMPLE_INVOICE.amountPaid;
  const isPaid = SAMPLE_INVOICE.status === 'PAID';

  // Inject print styles when modal is open
  useEffect(() => {
    if (!isOpen) return;

    const styleElement = document.createElement('style');
    styleElement.id = 'invoice-print-styles';
    styleElement.textContent = PRINT_STYLES;
    document.head.appendChild(styleElement);

    return () => {
      const existingStyle = document.getElementById('invoice-print-styles');
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, [isOpen]);

  const handlePrint = () => {
    // Build print HTML content
    const htmlContent = `<!DOCTYPE html>
<html>
  <head>
    <title>Invoice Preview - Align Designs</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
      .page { padding: 40px; page-break-after: always; }
      .page:last-child { page-break-after: auto; }
      .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
      .company-name { font-size: 24px; font-weight: bold; color: #D4A843; }
      .contact { font-size: 12px; color: #333; }
      .logo { text-align: center; }
      .logo-text { font-size: 12px; font-weight: bold; letter-spacing: 2px; }
      .separator { border-top: 1px solid #E5E5E5; margin: 20px 0; }
      .bill-section { display: flex; justify-content: space-between; margin-bottom: 20px; }
      .label { font-size: 12px; font-weight: bold; color: #D4A843; }
      .value { font-size: 12px; color: #333; margin-top: 4px; }
      .table-header { background: #D4A843; display: flex; padding: 10px; }
      .table-header span { color: white; font-weight: bold; font-size: 12px; }
      .table-body { border: 1px solid #E5E5E5; border-top: none; display: flex; }
      .desc-col { flex: 1; padding: 15px; border-right: 1px solid #E5E5E5; }
      .amount-col { width: 100px; padding: 15px; }
      .totals { display: flex; justify-content: flex-end; margin-top: 20px; }
      .totals-box { width: 200px; }
      .total-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 14px; }
      .total-row.main { font-weight: bold; border-top: 1px solid #E5E5E5; padding-top: 10px; }
      .balance-due { color: #C53030; font-weight: bold; }
      .terms-title { font-size: 14px; font-weight: bold; color: #D4A843; border-bottom: 1px solid #E5E5E5; padding-bottom: 15px; margin-bottom: 15px; }
      .terms-text { font-size: 12px; color: #333; line-height: 1.6; }
      .vertical-text { position: absolute; left: 10px; top: 50%; transform: rotate(-90deg) translateX(-50%); font-size: 12px; font-weight: bold; color: #D4A843; white-space: nowrap; }
      @media print { .page { padding: 30px; } }
    </style>
  </head>
  <body>
    <div class="page" style="position: relative;">
      <div class="vertical-text">Invoice ${SAMPLE_INVOICE.invoiceNumber}</div>
      <div style="margin-left: 30px;">
        <div class="header">
          <div>
            <div class="company-name">${COMPANY_INFO.name}</div>
            <div class="contact">${COMPANY_INFO.phone}</div>
            <div class="contact">${COMPANY_INFO.email}</div>
          </div>
          <div class="logo">
            <svg width="60" height="50" viewBox="0 0 60 50">
              <path d="M30 5 L10 40" stroke="#333" stroke-width="2.5" fill="none"/>
              <path d="M30 5 L50 40" stroke="#333" stroke-width="2.5" fill="none"/>
              <path d="M18 28 L42 28" stroke="#333" stroke-width="2.5" fill="none"/>
            </svg>
            <div class="logo-text">ALIGN</div>
          </div>
        </div>
        <div class="separator"></div>
        <div class="bill-section">
          <div>
            <div class="label">Bill To</div>
            <div class="value">${SAMPLE_INVOICE.client.company}</div>
          </div>
          <div style="text-align: right;">
            <span class="label">Invoice Date </span>
            <span class="value">${SAMPLE_INVOICE.issueDate}</span>
          </div>
        </div>
        <div class="table-header">
          <span style="flex: 1;">Description</span>
          <span style="width: 100px;">Amount</span>
        </div>
        <div class="table-body">
          <div class="desc-col">${SAMPLE_INVOICE.description.replaceAll('\n', '<br>')}</div>
          <div class="amount-col">${formatCurrency(SAMPLE_INVOICE.subtotal)}</div>
        </div>
        <div class="totals">
          <div class="totals-box">
            <div class="total-row main">
              <span>Total</span>
              <span>${formatCurrency(SAMPLE_INVOICE.totalAmount)}</span>
            </div>
            ${SAMPLE_INVOICE.amountPaid > 0 ? `
            <div class="total-row">
              <span>Amount Paid</span>
              <span>${formatCurrency(SAMPLE_INVOICE.amountPaid)}</span>
            </div>
            <div class="total-row balance-due">
              <span>Balance Due</span>
              <span>${formatCurrency(balanceDue)}</span>
            </div>
            ` : ''}
          </div>
        </div>
      </div>
    </div>
    <div class="page">
      <div class="terms-title">Terms &amp; Conditions</div>
      <div class="terms-text">
        <p>Any additional items requested beyond the scope of this package will be subject to separate charges. Feel free to reach out if you have any questions or if you require further customization. Engineering and permitting is not included.</p>
        <p style="margin-top: 15px;">Payment is due within 15 days.</p>
        <p style="margin-top: 15px; font-weight: 500;">Thank you for your business!</p>
      </div>
    </div>
  </body>
</html>`;

    // Create Blob URL and open in new window for printing
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const blobUrl = URL.createObjectURL(blob);
    const printWindow = globalThis.open(blobUrl, '_blank');

    if (!printWindow) {
      URL.revokeObjectURL(blobUrl);
      return;
    }

    // Print and cleanup after window loads
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
      printWindow.onafterprint = () => {
        printWindow.close();
        URL.revokeObjectURL(blobUrl);
      };
    };
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Invoice Template Preview"
      size="xl"
    >
      <div className="space-y-4" id="invoice-print-content">
        {/* Preview Notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 no-print">
          <p className="text-sm text-amber-800 flex items-center gap-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span><strong>Preview Mode:</strong> This shows how invoices will look. Data shown is for demonstration only.</span>
          </p>
        </div>

        {/* Invoice Document - Matching PDF Design */}
        <div className="bg-white rounded-lg overflow-hidden relative">
          {/* Vertical Invoice Number (Left Side) */}
          <div
            className="absolute left-0 top-0 bottom-0 w-8 flex items-center justify-center"
            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
          >
            <span
              className="text-sm font-bold tracking-wider"
              style={{ color: COLORS.primary }}
            >
              Invoice {SAMPLE_INVOICE.invoiceNumber}
            </span>
          </div>

          <div className="ml-8 p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
              <div>
                {/* Company Name */}
                <h2
                  className="text-2xl font-bold"
                  style={{ color: COLORS.primary }}
                >
                  {COMPANY_INFO.name}
                </h2>
                {/* Contact Info */}
                <p className="text-sm mt-1" style={{ color: COLORS.text }}>{COMPANY_INFO.phone}</p>
                <p className="text-sm" style={{ color: COLORS.text }}>{COMPANY_INFO.email}</p>
              </div>

              {/* Stylized A Logo */}
              <div className="flex flex-col items-center">
                <svg width="60" height="50" viewBox="0 0 60 50" className="mb-1">
                  <path
                    d="M30 5 L10 40"
                    stroke={COLORS.text}
                    strokeWidth="2.5"
                    fill="none"
                  />
                  <path
                    d="M30 5 L50 40"
                    stroke={COLORS.text}
                    strokeWidth="2.5"
                    fill="none"
                  />
                  <path
                    d="M18 28 L42 28"
                    stroke={COLORS.text}
                    strokeWidth="2.5"
                    fill="none"
                  />
                </svg>
                <span className="text-xs font-bold tracking-widest" style={{ color: COLORS.text }}>
                  ALIGN
                </span>
              </div>
            </div>

            {/* Separator */}
            <div className="border-t" style={{ borderColor: COLORS.border }} />

            {/* Bill To and Invoice Date */}
            <div className="flex justify-between">
              <div>
                <h3
                  className="text-sm font-bold"
                  style={{ color: COLORS.primary }}
                >
                  Bill To
                </h3>
                <p className="text-sm mt-1" style={{ color: COLORS.text }}>
                  {SAMPLE_INVOICE.client.company}
                </p>
              </div>
              <div className="text-right">
                <span
                  className="text-sm font-bold"
                  style={{ color: COLORS.primary }}
                >
                  Invoice Date{' '}
                </span>
                <span className="text-sm" style={{ color: COLORS.text }}>
                  {SAMPLE_INVOICE.issueDate}
                </span>
              </div>
            </div>

            {/* Description Table */}
            <div className="overflow-hidden rounded-sm">
              {/* Table Header */}
              <div
                className="flex"
                style={{ backgroundColor: COLORS.primary }}
              >
                <div className="flex-1 px-3 py-2">
                  <span className="text-sm font-bold text-white">Description</span>
                </div>
                <div className="w-28 px-3 py-2">
                  <span className="text-sm font-bold text-white">Amount</span>
                </div>
              </div>

              {/* Table Body */}
              <div className="flex border-l border-r border-b" style={{ borderColor: COLORS.border }}>
                <div
                  className="flex-1 px-3 py-4 whitespace-pre-line border-r"
                  style={{ borderColor: COLORS.border, color: COLORS.text }}
                >
                  <p className="text-sm">{SAMPLE_INVOICE.description}</p>
                </div>
                <div className="w-28 px-3 py-4">
                  <span className="text-sm" style={{ color: COLORS.text }}>
                    {formatCurrency(SAMPLE_INVOICE.subtotal)}
                  </span>
                </div>
              </div>
            </div>

            {/* PAID Stamp (positioned over table if paid) */}
            {isPaid && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 pointer-events-none">
                <div
                  className="border-4 rounded-lg px-8 py-4"
                  style={{ borderColor: COLORS.paid }}
                >
                  <span
                    className="text-5xl font-bold"
                    style={{ color: COLORS.paid }}
                  >
                    PAID
                  </span>
                </div>
              </div>
            )}

            {/* Total Section */}
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-base font-bold border-t pt-3" style={{ borderColor: COLORS.border }}>
                  <span style={{ color: COLORS.text }}>Total</span>
                  <span style={{ color: COLORS.text }}>{formatCurrency(SAMPLE_INVOICE.totalAmount)}</span>
                </div>

                {SAMPLE_INVOICE.amountPaid > 0 && !isPaid && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span style={{ color: COLORS.lightText }}>Amount Paid</span>
                      <span style={{ color: COLORS.lightText }}>{formatCurrency(SAMPLE_INVOICE.amountPaid)}</span>
                    </div>
                    <div className="flex justify-between text-base font-bold">
                      <span style={{ color: COLORS.paid }}>Balance Due</span>
                      <span style={{ color: COLORS.paid }}>{formatCurrency(balanceDue)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Page 2 Preview - Terms */}
        <div className="bg-white rounded-lg p-6 relative">
          <div className="border-b pb-4 mb-4" style={{ borderColor: COLORS.border }}>
            <h3
              className="text-base font-bold"
              style={{ color: COLORS.primary }}
            >
              Terms &amp; Conditions
            </h3>
          </div>
          <div className="text-sm space-y-3" style={{ color: COLORS.text }}>
            <p>
              Any additional items requested beyond the scope of this package will be subject to separate charges.
              Feel free to reach out if you have any questions or if you require further customization.
              Engineering and permitting is not included.
            </p>
            <p>Payment is due within 15 days.</p>
            <p className="font-medium">Thank you for your business!</p>
          </div>

          {/* PAID Stamp on terms page if paid */}
          {isPaid && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 pointer-events-none opacity-80">
              <div
                className="border-4 rounded-lg px-12 py-6"
                style={{ borderColor: COLORS.paid }}
              >
                <span
                  className="text-6xl font-bold"
                  style={{ color: COLORS.paid }}
                >
                  PAID
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2 no-print">
          <button
            onClick={handlePrint}
            className="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
            style={{
              backgroundColor: COLORS.primary,
              color: COLORS.white
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            Print Preview
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-white bg-[#1B1C1A] hover:brightness-95 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default memo(InvoicePreviewModal);
