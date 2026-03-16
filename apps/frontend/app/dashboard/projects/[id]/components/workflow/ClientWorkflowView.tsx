'use client';

import { memo, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Project, ProjectStatus } from '@/types';
import { ProjectStatusBadge } from '@/components/projects/ProjectStatusBadge';
import { PaymentProgressBar } from '@/components/projects/PaymentProgressBar';
import { CalendarIcon } from '@heroicons/react/24/outline';

interface InvoiceDeadline {
  date: Date;
  label: string;
  invoiceId: string;
  amount: number;
}

interface ClientWorkflowViewProps {
  project: Project;
  invoiceDeadlines: InvoiceDeadline[];
  pendingAmount: number;
  loadingInvoices: boolean;
}

// Color configuration for next step indicator
type NextStepColor = 'green' | 'amber' | 'blue';

interface ColorConfig {
  container: string;
  badge: string;
  title: string;
  text: string;
}

const NEXT_STEP_COLORS: Record<NextStepColor, ColorConfig> = {
  green: {
    container: 'bg-green-50 border-green-200',
    badge: 'bg-green-100 text-green-800',
    title: 'text-green-900',
    text: 'text-green-800',
  },
  amber: {
    container: 'bg-amber-50 border-amber-200',
    badge: 'bg-amber-100 text-amber-800',
    title: 'text-amber-900',
    text: 'text-amber-800',
  },
  blue: {
    container: 'bg-blue-50 border-blue-200',
    badge: 'bg-blue-100 text-blue-800',
    title: 'text-blue-900',
    text: 'text-blue-800',
  },
};

// Get progress percentage based on status
function getProgressPercentage(status: ProjectStatus): string {
  if (status === ProjectStatus.COMPLETED) return '100%';
  if (status === ProjectStatus.ACTIVE) return '50%';
  return '0%';
}

// Get progress bar color based on status
function getProgressBarColor(status: ProjectStatus): string {
  if (status === ProjectStatus.COMPLETED) return 'bg-green-500';
  if (status === ProjectStatus.ACTIVE) return 'bg-navy-600';
  return 'bg-stone-300';
}

// Next Step interface
interface NextStep {
  label: string;
  description: string;
  color: NextStepColor;
  action?: () => void;
  actionLabel?: string;
}

// NextStepIndicator component
const NextStepIndicator = memo(function NextStepIndicator({ nextStep }: { nextStep: NextStep }) {
  const colors = NEXT_STEP_COLORS[nextStep.color];

  return (
    <div className={`rounded-xl border p-4 mb-6 ${colors.container}`}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${colors.badge}`}>
              Next Step
            </span>
          </div>
          <h3 className={`font-semibold text-lg ${colors.title}`}>
            {nextStep.label}
          </h3>
          <p className={`text-sm opacity-80 mt-1 ${colors.text}`}>
            {nextStep.description}
          </p>
        </div>

        {nextStep.action && nextStep.actionLabel && (
          <button
            onClick={nextStep.action}
            className="flex items-center gap-1 px-4 py-2 bg-navy-800 text-white rounded-lg hover:bg-navy-700 transition-colors text-sm font-medium shrink-0"
          >
            {nextStep.actionLabel}
          </button>
        )}
      </div>
    </div>
  );
});

function ClientWorkflowView({
  project,
  invoiceDeadlines,
  pendingAmount,
  loadingInvoices,
}: Readonly<ClientWorkflowViewProps>) {
  const router = useRouter();

  // IMPORTANT: All hooks must be called before any conditional returns
  // Calculate next step for the client
  const nextStep = useMemo((): NextStep => {
    if (project.status === ProjectStatus.COMPLETED) {
      return {
        label: 'Project Complete',
        description: 'Your project has been completed. Download your final deliverables from the Final Deliverables section.',
        color: 'green',
      };
    }

    if (invoiceDeadlines.length > 0) {
      return {
        label: 'Pay Outstanding Invoice',
        description: 'You have an invoice pending payment.',
        color: 'amber',
        action: () => router.push(`/dashboard/projects/${project.id}/payments`),
        actionLabel: 'View Invoice',
      };
    }

    // Default: work in progress
    return {
      label: 'Design In Progress',
      description: 'Your project is being worked on. We\'ll notify you when there\'s something to review.',
      color: 'blue',
    };
  }, [project.status, invoiceDeadlines, router, project.id]);

  // Waiting for initial payment
  if (project.status === ProjectStatus.WAITING_PAYMENT) {
    const isPendingCoverage =
      Number(project.amountPaid || 0) + pendingAmount >= Number(project.initialAmountRequired || 0);

    return (
      <div className="bg-white rounded-2xl shadow-lg border border-stone-200 p-8 mb-6">
        <div className="text-center max-w-2xl mx-auto">
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-10 h-10 text-amber-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-navy-900 mb-3">Initial Payment Required</h2>

          <p className="text-base text-stone-600 mb-2">
            This project requires an initial payment to start. Please upload your payment proof to continue.
          </p>

          {project.initialAmountRequired && (
            <div className="bg-navy-50 border border-navy-200 rounded-lg p-4 mb-6 inline-block">
              <p className="text-sm text-navy-700 mb-1">Amount Required</p>
              <p className="text-3xl font-bold text-navy-900">
                ${Number(project.initialAmountRequired).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
          )}

          {project.initialPaymentDeadline && (
            <p className="text-sm text-stone-600 mb-6">
              <span className="font-medium">Payment Deadline:</span>{' '}
              {new Date(project.initialPaymentDeadline).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
              {new Date(project.initialPaymentDeadline) < new Date() && (
                <span className="ml-2 text-red-600 font-semibold">⚠️ Overdue</span>
              )}
            </p>
          )}

          {isPendingCoverage ? (
            <div className="w-full px-8 py-3 bg-gray-100 text-gray-500 rounded-lg font-medium shadow-sm flex items-center justify-center gap-2 border border-gray-200 cursor-not-allowed mx-auto max-w-md">
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Waiting for Approval
            </div>
          ) : (
            <button
              onClick={() => router.push(`/dashboard/projects/${project.id}/payments`)}
              className="px-8 py-3 bg-navy-800 hover:bg-navy-700 text-white rounded-lg font-semibold transition-colors shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              Upload Payment Proof
            </button>
          )}

          <p className="text-xs text-stone-500 mt-6">
            💡 The project will be activated once the admin approves your payment
          </p>
        </div>
      </div>
    );
  }

  // Active project status - Project Overview
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-stone-200 p-6 mb-6">
      {/* Header with status badge */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-navy-900">Project Overview</h2>
        <ProjectStatusBadge status={project.status} />
      </div>

      {/* Project Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-stone-600">Project Progress</span>
          <span className="text-sm font-semibold text-navy-900">
            {getProgressPercentage(project.status)}
          </span>
        </div>
        <div className="h-3 bg-stone-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${getProgressBarColor(project.status)}`}
            style={{ width: getProgressPercentage(project.status) }}
          />
        </div>
        <div className="flex justify-between text-xs text-stone-500 mt-1">
          <span>Start</span>
          <span>In Progress</span>
          <span>Complete</span>
        </div>
      </div>

      {/* Project Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Estimated Delivery */}
        {project.deadlineDate && (
          <div className="bg-stone-50 rounded-lg p-4 border border-stone-200">
            <div className="flex items-center gap-2 text-stone-500 text-sm mb-1">
              <CalendarIcon className="w-4 h-4" />
              <span>Estimated Delivery</span>
            </div>
            <p className="font-semibold text-navy-900">
              {new Date(project.deadlineDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        )}

        {/* Payment Status Summary */}
        <div className="bg-stone-50 rounded-lg p-4 border border-stone-200">
          <div className="flex items-center gap-2 text-stone-500 text-sm mb-1">
            <span>💰</span>
            <span>Payment Status</span>
          </div>
          <p className="font-semibold text-navy-900">
            {invoiceDeadlines.length === 0 && 'All caught up'}
            {invoiceDeadlines.length === 1 && '1 pending invoice'}
            {invoiceDeadlines.length > 1 && `${invoiceDeadlines.length} pending invoices`}
          </p>
        </div>
      </div>

      {/* Next Step Indicator */}
      <NextStepIndicator nextStep={nextStep} />

      {/* Payment Details Section */}
      <div className="border border-stone-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-navy-900">Payment Details</h3>
          <button
            onClick={() => router.push(`/dashboard/projects/${project.id}/payments`)}
            className="text-sm px-3 py-1.5 bg-navy-800 hover:bg-navy-700 text-white rounded-lg font-medium transition-colors"
          >
            View Payments
          </button>
        </div>

        {loadingInvoices ? (
          <div className="flex justify-center items-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-800" />
          </div>
        ) : (
          <PaymentStatusContent
            project={project}
            invoiceDeadlines={invoiceDeadlines}
            pendingAmount={pendingAmount}
          />
        )}
      </div>
    </div>
  );
}

// Extracted payment status content for cleaner code
const PaymentStatusContent = memo(function PaymentStatusContent({
  project,
  invoiceDeadlines,
  pendingAmount,
}: {
  project: Project;
  invoiceDeadlines: InvoiceDeadline[];
  pendingAmount: number;
}) {
  const router = useRouter();

  if (invoiceDeadlines.length > 0) {
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
                  Due: {invoice.date.toLocaleDateString()}
                  {invoice.date < new Date() && ' (Overdue)'}
                </span>
                <button
                  onClick={() => router.push(`/dashboard/projects/${project.id}/payments`)}
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
  }

  const initialPaid = Number(project.amountPaid || 0);
  const initialRequired = Number(project.initialAmountRequired || 0);
  const isInitialPaymentComplete = initialRequired > 0 && initialPaid >= initialRequired;

  if (isInitialPaymentComplete && invoiceDeadlines.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
        <p className="text-sm font-medium text-green-800">All Payments Up to Date</p>
        <p className="text-xs text-green-700 mt-1">No pending invoices.</p>
      </div>
    );
  }

  if (project.initialAmountRequired !== null && project.initialAmountRequired !== undefined) {
    return (
      <PaymentProgressBar
        paid={Number(project.amountPaid)}
        required={Number(project.initialAmountRequired)}
        pendingAmount={pendingAmount}
      />
    );
  }

  return (
    <div className="bg-stone-50 border border-stone-200 rounded-lg p-3">
      <p className="text-sm font-medium text-stone-700">No payment required yet</p>
    </div>
  );
});

export default memo(ClientWorkflowView);
