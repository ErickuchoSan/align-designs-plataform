'use client';

import { useState, memo } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Project, ProjectStatus, ProjectEmployee, User } from '@/types';
import { Payment } from '@/types/payments';
import { ProjectStatusBadge } from '@/components/projects/ProjectStatusBadge';
import { PaymentProgressBar } from '@/components/projects/PaymentProgressBar';
import ManageEmployeesModal from '@/components/dashboard/ManageEmployeesModal';

const CompletionChecklistModal = dynamic(
  () => import('@/components/projects/CompletionChecklistModal'),
  { loading: () => null, ssr: false }
);

const PaymentHistoryModal = dynamic(
  () => import('@/components/payments/PaymentHistoryModal'),
  { loading: () => null, ssr: false }
);

const ConfirmModal = dynamic(
  () => import('@/components/modals/ConfirmModal'),
  { loading: () => null, ssr: false }
);

interface InvoiceDeadline {
  date: Date;
  label: string;
  invoiceId: string;
  amount: number;
}

interface PaymentProgress {
  paid: number;
  total: number;
  percentage: number;
  pendingInvoiceCount: number;
}

interface AdminWorkflowViewProps {
  project: Project;
  invoiceDeadlines: InvoiceDeadline[];
  paymentProgress: PaymentProgress;
  payments: Payment[];
  pendingAmount: number;
  loadingInvoices: boolean;
  checklistData: any;
  processing: boolean;
  error: string;
  onUpdate: () => void;
  onFetchCompletionStatus: () => Promise<void>;
  onCompleteProject: () => Promise<boolean>;
  onArchiveProject: () => Promise<boolean>;
}

function AdminWorkflowView({
  project,
  invoiceDeadlines,
  paymentProgress,
  payments,
  pendingAmount,
  loadingInvoices,
  checklistData,
  processing,
  error,
  onUpdate,
  onFetchCompletionStatus,
  onCompleteProject,
  onArchiveProject,
}: Readonly<AdminWorkflowViewProps>) {
  // Modal states
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showPaymentHistoryModal, setShowPaymentHistoryModal] = useState(false);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [showChecklistModal, setShowChecklistModal] = useState(false);

  const canComplete = project.status === ProjectStatus.ACTIVE;
  const canArchive = project.status === ProjectStatus.COMPLETED;

  const handleArchiveClick = async () => {
    await onFetchCompletionStatus();
    setShowChecklistModal(true);
  };

  const handleConfirmArchive = async () => {
    const success = await onArchiveProject();
    if (success) setShowChecklistModal(false);
  };

  const handleCompleteConfirm = async () => {
    const success = await onCompleteProject();
    if (success) setShowCompleteConfirm(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-stone-200 p-6 mb-6">
      {/* Error message */}
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-4" role="alert">
          <p className="text-sm font-medium text-red-800">{error}</p>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-navy-900">Project Workflow</h2>
        <ProjectStatusBadge status={project.status} />
      </div>

      {/* Status Actions */}
      <div className="mb-6 flex flex-wrap gap-3">
        {canComplete && (
          <button
            onClick={() => setShowCompleteConfirm(true)}
            disabled={processing}
            className="px-4 py-2 bg-navy-600 hover:bg-navy-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Mark as Completed
          </button>
        )}
        {canArchive && (
          <button
            onClick={handleArchiveClick}
            disabled={processing}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Archive Project
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Payment Section */}
        <PaymentSection
          project={project}
          invoiceDeadlines={invoiceDeadlines}
          pendingAmount={pendingAmount}
          loadingInvoices={loadingInvoices}
          onShowHistory={() => setShowPaymentHistoryModal(true)}
        />

        {/* Employees Section */}
        <EmployeesSection
          employees={project.employees || []}
          onManageClick={() => setShowEmployeeModal(true)}
        />
      </div>

      {/* Modals */}
      {showEmployeeModal && (
        <ManageEmployeesModal
          isOpen={showEmployeeModal}
          onClose={() => setShowEmployeeModal(false)}
          projectId={project.id}
          currentEmployees={project.employees || []}
          onSuccess={onUpdate}
        />
      )}

      {showChecklistModal && checklistData && (
        <CompletionChecklistModal
          isOpen={showChecklistModal}
          onClose={() => setShowChecklistModal(false)}
          isLoading={processing}
          isReady={checklistData.isReady}
          checklist={checklistData.checklist}
          counts={checklistData.counts}
          onArchive={handleConfirmArchive}
        />
      )}

      <ConfirmModal
        isOpen={showCompleteConfirm}
        onClose={() => setShowCompleteConfirm(false)}
        onConfirm={handleCompleteConfirm}
        title="Complete Project"
        message="Are you sure you want to mark this project as completed? This indicates all work has been finished."
        confirmText="Mark as Completed"
        variant="info"
        isLoading={processing}
      />

      <PaymentHistoryModal
        isOpen={showPaymentHistoryModal}
        onClose={() => setShowPaymentHistoryModal(false)}
        payments={payments}
        isLoading={false}
        isAdmin={true}
        projectName={project.name}
        amountPaid={paymentProgress.paid || Number(project.amountPaid || 0)}
        amountRequired={paymentProgress.total || Number(project.initialAmountRequired || 0)}
      />
    </div>
  );
}

// Payment Section Component
const PaymentSection = memo(function PaymentSection({
  project,
  invoiceDeadlines,
  pendingAmount,
  loadingInvoices,
  onShowHistory,
}: {
  project: Project;
  invoiceDeadlines: InvoiceDeadline[];
  pendingAmount: number;
  loadingInvoices: boolean;
  onShowHistory: () => void;
}) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="border border-stone-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-navy-900">Payment Status</h3>
        <button
          onClick={onShowHistory}
          className="text-sm px-3 py-1.5 border border-navy-200 text-navy-800 hover:bg-navy-50 rounded-lg font-medium transition-colors"
        >
          History
        </button>
      </div>

      {loadingInvoices ? (
        <div className="flex justify-center items-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-800" />
        </div>
      ) : (
        <PaymentStatusDisplay
          project={project}
          invoiceDeadlines={invoiceDeadlines}
          pendingAmount={pendingAmount}
        />
      )}

      {project.deadlineDate && (
        <div className="mt-4 pt-4 border-t border-stone-200">
          <p className="text-xs font-medium text-stone-500 mb-1">Project Completion Deadline</p>
          <p className="text-sm font-medium text-navy-900">{formatDate(project.deadlineDate)}</p>
          {new Date(project.deadlineDate) < new Date() && (
            <p className="text-xs text-red-600 mt-0.5">Overdue</p>
          )}
        </div>
      )}
    </div>
  );
});

// Payment Status Display
const PaymentStatusDisplay = memo(function PaymentStatusDisplay({
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
  }

  if (!isInitialPaymentComplete && initialRequired > 0) {
    return (
      <PaymentProgressBar paid={initialPaid} required={initialRequired} pendingAmount={pendingAmount} />
    );
  }

  return (
    <div className="bg-stone-50 border border-stone-200 rounded-lg p-3">
      <p className="text-sm font-medium text-stone-700">No Active Payments</p>
    </div>
  );
});

// Employees Section Component
const EmployeesSection = memo(function EmployeesSection({
  employees,
  onManageClick,
}: {
  employees: ProjectEmployee[];
  onManageClick: () => void;
}) {
  const validEmployees = employees.filter(
    (a): a is ProjectEmployee & { employee: User } => !!a.employee
  );

  return (
    <div className="border border-stone-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-navy-900">Assigned Employees</h3>
        <button
          onClick={onManageClick}
          className="text-sm px-3 py-1.5 bg-steel-700 hover:bg-steel-600 text-white rounded-lg font-medium transition-colors"
        >
          Manage Employees
        </button>
      </div>

      {validEmployees.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {validEmployees.map((assignment) => (
            <div
              key={assignment.employee.id}
              className="flex items-center gap-2 px-3 py-2 bg-stone-100 rounded-lg"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-navy-600 to-navy-800 rounded-full flex items-center justify-center text-gold-400 text-sm font-semibold">
                {assignment.employee.firstName[0]}
                {assignment.employee.lastName[0]}
              </div>
              <span className="text-sm font-medium text-navy-900">
                {assignment.employee.firstName} {assignment.employee.lastName}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-stone-600">No employees assigned</p>
      )}
    </div>
  );
});

export default memo(AdminWorkflowView);
