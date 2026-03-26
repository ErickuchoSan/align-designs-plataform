'use client';

import { memo } from 'react';
import { useRouter } from 'next/navigation';
import type { InvoiceDeadline } from '@/types/payments';
import type { Project } from '@/types';
import { PaymentProgressBar } from '@/components/projects/PaymentProgressBar';
import { formatDate } from '@/lib/date.utils';

/**
 * Loading spinner for payment sections
 */
export const PaymentLoadingSpinner = memo(function PaymentLoadingSpinner() {
  return (
    <div className="flex justify-center items-center py-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-800" />
    </div>
  );
});

/**
 * Props for InvoiceDeadlinesList component
 */
interface InvoiceDeadlinesListProps {
  invoiceDeadlines: InvoiceDeadline[];
  projectId: string;
}

/**
 * Renders a list of invoice deadlines with amounts and due dates
 * Used in both AdminWorkflowView and ClientWorkflowView
 */
export const InvoiceDeadlinesList = memo(function InvoiceDeadlinesList({
  invoiceDeadlines,
  projectId,
}: InvoiceDeadlinesListProps) {
  const router = useRouter();
  const totalPending = invoiceDeadlines.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div>
      <div className="mb-3">
        <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">
          Total Outstanding
        </p>
        <p className="text-2xl font-bold text-navy-900">
          ${totalPending.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      </div>

      <div className="space-y-3">
        {invoiceDeadlines.map((invoice) => (
          <div
            key={invoice.invoiceId}
            className="bg-white border border-stone-200 rounded-lg p-3 shadow-sm"
          >
            <div className="flex justify-between items-start mb-1">
              <span className="font-semibold text-navy-800 text-sm">{invoice.label}</span>
              <span className="font-bold text-navy-900 text-sm">
                ${invoice.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span
                className={`${invoice.date < new Date() ? 'text-red-600 font-medium' : 'text-stone-500'}`}
              >
                Due: {formatDate(invoice.date)}
                {invoice.date < new Date() && ' (Overdue)'}
              </span>
              <button
                onClick={() => router.push(`/dashboard/projects/${projectId}/payments`)}
                className="text-navy-600 hover:text-navy-800 hover:underline"
              >
                Pay Now
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

/**
 * Success message when all payments are up to date
 * Variant: 'detailed' shows icon and more text (Admin), 'compact' is simpler (Client)
 */
interface PaymentUpToDateProps {
  variant?: 'detailed' | 'compact';
}

export const PaymentUpToDate = memo(function PaymentUpToDate({
  variant = 'detailed',
}: PaymentUpToDateProps) {
  if (variant === 'compact') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
        <p className="text-sm font-medium text-green-800">All Payments Up to Date</p>
        <p className="text-xs text-green-700 mt-1">No pending invoices.</p>
      </div>
    );
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
      <div className="flex items-center gap-3">
        <svg
          className="w-8 h-8 text-green-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div>
          <p className="text-sm font-semibold text-green-800">All Caught Up</p>
          <p className="text-xs text-green-700 mt-0.5">No pending invoices. You are up to date!</p>
        </div>
      </div>
    </div>
  );
});

/**
 * Message when no active payments exist
 * Variant: 'admin' says "No Active Payments", 'client' says "No payment required yet"
 */
interface NoActivePaymentsProps {
  variant?: 'admin' | 'client';
}

export const NoActivePayments = memo(function NoActivePayments({
  variant = 'admin',
}: NoActivePaymentsProps) {
  const message = variant === 'client' ? 'No payment required yet' : 'No Active Payments';

  return (
    <div className="bg-stone-50 border border-stone-200 rounded-lg p-3">
      <p className="text-sm font-medium text-stone-700">{message}</p>
    </div>
  );
});

/**
 * Common payment status display logic
 * Handles: pending invoices, all paid, initial payment progress, and no payments
 */
interface PaymentStatusDisplayProps {
  project: Project;
  invoiceDeadlines: InvoiceDeadline[];
  pendingAmount: number;
  variant?: 'admin' | 'client';
}

export const PaymentStatusDisplay = memo(function PaymentStatusDisplay({
  project,
  invoiceDeadlines,
  pendingAmount,
  variant = 'admin',
}: PaymentStatusDisplayProps) {
  // Case 1: Has pending invoices
  if (invoiceDeadlines.length > 0) {
    return (
      <InvoiceDeadlinesList
        invoiceDeadlines={invoiceDeadlines}
        projectId={project.id}
      />
    );
  }

  const initialPaid = Number(project.amountPaid || 0);
  const initialRequired = Number(project.initialAmountRequired || 0);
  const isInitialPaymentComplete = initialRequired > 0 && initialPaid >= initialRequired;

  // Case 2: Initial payment complete, no pending invoices
  if (isInitialPaymentComplete) {
    return <PaymentUpToDate variant={variant === 'client' ? 'compact' : 'detailed'} />;
  }

  // Case 3: Initial payment in progress (Admin) or required (Client)
  if (variant === 'admin' && !isInitialPaymentComplete && initialRequired > 0) {
    return (
      <PaymentProgressBar paid={initialPaid} required={initialRequired} pendingAmount={pendingAmount} />
    );
  }

  if (variant === 'client' && project.initialAmountRequired !== null && project.initialAmountRequired !== undefined) {
    return (
      <PaymentProgressBar
        paid={Number(project.amountPaid)}
        required={Number(project.initialAmountRequired)}
        pendingAmount={pendingAmount}
      />
    );
  }

  // Case 4: No active payments
  return <NoActivePayments variant={variant} />;
});
