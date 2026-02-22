'use client';

import { useState, useCallback, useEffect, memo } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Project, ProjectStatus, ProjectEmployee, User } from '@/types';
import { Payment } from '@/types/payments';
import { ProjectStatusBadge } from '@/components/projects/ProjectStatusBadge';
import { PaymentProgressBar } from '@/components/projects/PaymentProgressBar';

import ManageEmployeesModal from '@/components/dashboard/ManageEmployeesModal';

const CompletionChecklistModal = dynamic(() => import('@/components/projects/CompletionChecklistModal'), {
  loading: () => null,
  ssr: false,
});

const PaymentHistoryModal = dynamic(() => import('@/components/payments/PaymentHistoryModal'), {
  loading: () => null,
  ssr: false,
});

const ConfirmModal = dynamic(() => import('@/components/modals/ConfirmModal'), {
  loading: () => null,
  ssr: false,
});
import { ProjectsService } from '@/services/projects.service';
import { InvoicesService } from '@/services/invoices.service';
import { PaymentsService } from '@/services/payments.service';
import { handleApiError, logError } from '@/lib/errors';

interface ProjectWorkflowSectionProps {
  project: Project;
  isAdmin: boolean;
  onUpdate: () => void;
  userRole?: string;
}

/**
 * ProjectWorkflowSection Component
 *
 * Displays and manages project workflow:
 * - Status overview with action buttons (Admin)
 * - Employee assignments (Admin)
 * - Payment tracking (Admin & Client)
 * - Deadline information (Admin)
 *
 * Admins see full workflow controls, clients see payment status only
 */
function ProjectWorkflowSection({
  project,
  isAdmin,
  onUpdate,
  userRole,
}: ProjectWorkflowSectionProps) {
  const router = useRouter();
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showPaymentHistoryModal, setShowPaymentHistoryModal] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);

  // Invoice-based payment tracking
  const [invoiceDeadlines, setInvoiceDeadlines] = useState<Array<{ date: Date; label: string; invoiceId: string; amount: number }>>([]);
  const [paymentProgress, setPaymentProgress] = useState<{ paid: number; total: number; percentage: number; pendingInvoiceCount: number }>({ paid: 0, total: 0, percentage: 0, pendingInvoiceCount: 0 });
  const [loadingInvoices, setLoadingInvoices] = useState(true);

  const isClient = userRole === 'CLIENT';

  // Load invoices and calculate payment progress
  useEffect(() => {
    const loadInvoiceData = async () => {
      try {
        setLoadingInvoices(true);
        const [deadlines, progress] = await Promise.all([
          InvoicesService.getDeadlinesByProject(project.id),
          InvoicesService.getPaymentProgress(project.id),
        ]);
        setInvoiceDeadlines(deadlines);
        setPaymentProgress(progress);
      } catch (err) {
        // Silent error - invoice data loading is non-critical
      } finally {
        setLoadingInvoices(false);
      }
    };

    loadInvoiceData();
  }, [project.id, project]); // Reload when project is updated (e.g. parent triggers refresh)

  // Check for pending payments to block initial upload if covered
  const [pendingAmount, setPendingAmount] = useState(0);

  useEffect(() => {
    const checkPending = async () => {
      try {
        const paymentsData = await PaymentsService.findAllByProject(project.id);
        setPayments(paymentsData);
        const pending = paymentsData
          .filter((p: Payment) => p.status === 'PENDING_APPROVAL')
          .reduce((sum: number, p: Payment) => sum + Number(p.amount), 0);
        setPendingAmount(pending);
      } catch (error) {
        // Silent error - pending payments check is non-critical
      }
    };
    checkPending();
  }, [project.id, project.amountPaid]); // Reload when payment amount changes

  // Admin-only state and callbacks (declared before any returns to satisfy React hooks rules)
  const [showChecklistModal, setShowChecklistModal] = useState(false);
  const [checklistData, setChecklistData] = useState<any>(null);
  const [checklistLoading, setChecklistLoading] = useState(false);

  const handleCompleteProject = useCallback(async () => {
    setProcessing(true);
    setError('');

    try {
      await ProjectsService.complete(project.id);
      onUpdate();
    } catch (err) {
      logError(err, 'Error completing project');
      setError(handleApiError(err, 'Failed to complete project'));
    } finally {
      setProcessing(false);
    }
  }, [project.id, onUpdate]);

  const handleArchiveClick = useCallback(async () => {
    setChecklistLoading(true);
    setError('');

    try {
      const status = await ProjectsService.getCompletionStatus(project.id);
      setChecklistData(status);
      setShowChecklistModal(true);
    } catch (err) {
      logError(err, 'Error fetching completion status');
      setError(handleApiError(err, 'Failed to fetch project status'));
    } finally {
      setChecklistLoading(false);
    }
  }, [project.id]);

  const handleConfirmArchive = useCallback(async () => {
    setProcessing(true);
    setError('');

    try {
      await ProjectsService.archive(project.id);
      setShowChecklistModal(false);
      onUpdate();
    } catch (err) {
      logError(err, 'Error archiving project');
      setError(handleApiError(err, 'Failed to archive project'));
    } finally {
      setProcessing(false);
    }
  }, [project.id, onUpdate]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const canComplete = project.status === ProjectStatus.ACTIVE;
  const canArchive = project.status === ProjectStatus.COMPLETED;

  // For clients, show simplified payment section
  if (isClient) {
    // If project is waiting for payment, show prominent payment prompt
    if (project.status === ProjectStatus.WAITING_PAYMENT) {
      return (
        <div className="bg-white rounded-2xl shadow-lg border border-stone-200 p-8 mb-6">
          <div className="text-center max-w-2xl mx-auto">
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-navy-900 mb-3">
              Initial Payment Required
            </h2>

            <p className="text-base text-stone-600 mb-2">
              This project requires an initial payment to start. Please upload your payment proof to continue.
            </p>

            {project.initialAmountRequired && (
              <div className="bg-navy-50 border border-navy-200 rounded-lg p-4 mb-6 inline-block">
                <p className="text-sm text-navy-700 mb-1">Amount Required</p>
                <p className="text-3xl font-bold text-navy-900">
                  ${Number(project.initialAmountRequired).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            )}

            {project.initialPaymentDeadline && (
              <p className="text-sm text-stone-600 mb-6">
                <span className="font-medium">Payment Deadline:</span>{' '}
                {new Date(project.initialPaymentDeadline).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
                {new Date(project.initialPaymentDeadline) < new Date() && (
                  <span className="ml-2 text-red-600 font-semibold">⚠️ Overdue</span>
                )}
              </p>
            )}

            {/* Check if pending payments cover the required amount */}
            {(Number(project.amountPaid || 0) + pendingAmount) >= Number(project.initialAmountRequired || 0) ? (
              <div className="w-full px-8 py-3 bg-gray-100 text-gray-500 rounded-lg font-medium shadow-sm flex items-center justify-center gap-2 border border-gray-200 cursor-not-allowed mx-auto max-w-md">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
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

    // For active projects, show payment progress
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-stone-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-navy-900">Project Status</h2>
          <ProjectStatusBadge status={project.status} />
        </div>

        <div className="border border-stone-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-navy-900">Payment Status</h3>
            <button
              onClick={() => router.push(`/dashboard/projects/${project.id}/payments`)}
              className="text-sm px-3 py-1.5 bg-navy-800 hover:bg-navy-700 text-white rounded-lg font-medium transition-colors"
            >
              View Payments
            </button>
          </div>

          {loadingInvoices ? (
            <div className="flex justify-center items-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-800"></div>
            </div>
          ) : (() => {
            // Check for pending invoices first
            if (invoiceDeadlines.length > 0) {
              const totalPending = invoiceDeadlines.reduce((sum, item) => sum + item.amount, 0);

              return (
                <div>
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">Total Outstanding</p>
                    <p className="text-2xl font-bold text-navy-900">
                      ${totalPending.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>

                  <div className="space-y-3">
                    {invoiceDeadlines.map((invoice) => (
                      <div key={invoice.invoiceId} className="bg-white border border-stone-200 rounded-lg p-3 shadow-sm">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-semibold text-navy-800 text-sm">{invoice.label}</span>
                          <span className="font-bold text-navy-900 text-sm">
                            ${invoice.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className={`${invoice.date < new Date() ? 'text-red-600 font-medium' : 'text-stone-500'}`}>
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

            // Fallback: Check if initial payment is complete (for cases with no invoices yet)
            const initialPaid = Number(project.amountPaid || 0);
            const initialRequired = Number(project.initialAmountRequired || 0);
            const isInitialPaymentComplete = initialRequired > 0 && initialPaid >= initialRequired;

            if (isInitialPaymentComplete && invoiceDeadlines.length === 0) {
              return (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm font-medium text-green-800">
                    All Payments Up to Date
                  </p>
                  <p className="text-xs text-green-700 mt-1">
                    No pending invoices.
                  </p>
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
                <p className="text-sm font-medium text-stone-700">
                  No payment required yet
                </p>
              </div>
            );
          })()}
        </div>
      </div>
    );
  }

  // For employees, don't show workflow section
  if (!isAdmin) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-stone-200 p-6 mb-6">
      {/* Error message */}
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-4">
          <p className="text-sm font-medium text-red-800">{error}</p>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-navy-900">Project Workflow</h2>
        <div className="flex gap-2">
          <ProjectStatusBadge status={project.status} />
        </div>
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
        {/* Payment Section - Now using Invoice data */}
        <div className="border border-stone-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-navy-900">Payment Status</h3>
            <button
              onClick={() => setShowPaymentHistoryModal(true)}
              className="text-sm px-3 py-1.5 border border-navy-200 text-navy-800 hover:bg-navy-50 rounded-lg font-medium transition-colors"
            >
              History
            </button>
          </div>

          {loadingInvoices ? (
            <div className="flex justify-center items-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-800"></div>
            </div>
          ) : (() => {
            // Check for pending invoices first
            if (invoiceDeadlines.length > 0) {
              const totalPending = invoiceDeadlines.reduce((sum, item) => sum + item.amount, 0);

              return (
                <div>
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">Total Outstanding</p>
                    <p className="text-2xl font-bold text-navy-900">
                      ${totalPending.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>

                  <div className="space-y-3">
                    {invoiceDeadlines.map((invoice) => (
                      <div key={invoice.invoiceId} className="bg-white border border-stone-200 rounded-lg p-3 shadow-sm">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-semibold text-navy-800 text-sm">{invoice.label}</span>
                          <span className="font-bold text-navy-900 text-sm">
                            ${invoice.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className={`${invoice.date < new Date() ? 'text-red-600 font-medium' : 'text-stone-500'}`}>
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

            // Check if initial payment is complete
            const initialPaid = Number(project.amountPaid || 0);
            const initialRequired = Number(project.initialAmountRequired || 0);
            const isInitialPaymentComplete = initialRequired > 0 && initialPaid >= initialRequired;

            if (isInitialPaymentComplete && invoiceDeadlines.length === 0) {
              return (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-sm font-semibold text-green-800">
                        All Caught Up
                      </p>
                      <p className="text-xs text-green-700 mt-0.5">
                        No pending invoices. You are up to date!
                      </p>
                    </div>
                  </div>
                </div>
              );
            }

            // Fallback for initial payment pending (if deadlines logic misses it, or if no invoices generated yet but initial pending)
            if (!isInitialPaymentComplete && initialRequired > 0) {
              return (
                <PaymentProgressBar
                  paid={initialPaid}
                  required={initialRequired}
                  pendingAmount={pendingAmount}
                />
              );
            }

            return (
              <div className="bg-stone-50 border border-stone-200 rounded-lg p-3">
                <p className="text-sm font-medium text-stone-700">
                  No Active Payments
                </p>
              </div>
            );
          })()}

          {/* Project Completion Deadline */}
          {project.deadlineDate && (
            <div className="mt-4 pt-4 border-t border-stone-200">
              <p className="text-xs font-medium text-stone-500 mb-1">Project Completion Deadline</p>
              <p className="text-sm font-medium text-navy-900">
                {formatDate(project.deadlineDate)}
              </p>
              {new Date(project.deadlineDate) < new Date() && (
                <p className="text-xs text-red-600 mt-0.5">Overdue</p>
              )}
            </div>
          )}
        </div>



        {/* Employees Section - Moved to second column */}
        <div className="border border-stone-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-navy-900">Assigned Employees</h3>
            <button
              onClick={() => setShowEmployeeModal(true)}
              className="text-sm px-3 py-1.5 bg-steel-700 hover:bg-steel-600 text-white rounded-lg font-medium transition-colors"
            >
              Manage Employees
            </button>
          </div>

          {project.employees && project.employees.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {project.employees.filter((a): a is ProjectEmployee & { employee: User } => !!a.employee).map((assignment) => (
                <div
                  key={assignment.employee.id}
                  className="flex items-center gap-2 px-3 py-2 bg-stone-100 rounded-lg"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-navy-600 to-navy-800 rounded-full flex items-center justify-center text-gold-400 text-sm font-semibold">
                    {assignment.employee.firstName[0]}{assignment.employee.lastName[0]}
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
      </div>

      {/* Employee Modal */}
      {showEmployeeModal && (
        <ManageEmployeesModal
          isOpen={showEmployeeModal}
          onClose={() => setShowEmployeeModal(false)}
          projectId={project.id}
          currentEmployees={project.employees || []}
          onSuccess={onUpdate}
        />
      )}

      {/* Completion Checklist Modal */}
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

      {/* Confirmation Modals */}
      <ConfirmModal
        isOpen={showCompleteConfirm}
        onClose={() => setShowCompleteConfirm(false)}
        onConfirm={handleCompleteProject}
        title="Complete Project"
        message="Are you sure you want to mark this project as completed? This indicates all work has been finished."
        confirmText="Mark as Completed"
        variant="info"
        isLoading={processing}
      />

      {/* Payment History Modal */}
      <PaymentHistoryModal
        isOpen={showPaymentHistoryModal}
        onClose={() => setShowPaymentHistoryModal(false)}
        payments={payments}
        isLoading={loadingPayments}
        isAdmin={isAdmin}
        projectName={project.name}
        amountPaid={paymentProgress.paid || Number(project.amountPaid || 0)}
        amountRequired={paymentProgress.total || Number(project.initialAmountRequired || 0)}
      />
    </div>
  );
}

// Memoize component to prevent unnecessary re-renders
// Only re-renders when project data or critical props change
export default memo(ProjectWorkflowSection, (prevProps, nextProps) => {
  return (
    prevProps.project.id === nextProps.project.id &&
    prevProps.project.status === nextProps.project.status &&
    prevProps.project.initialAmountRequired === nextProps.project.initialAmountRequired &&
    prevProps.project.amountPaid === nextProps.project.amountPaid &&
    prevProps.project.employees === nextProps.project.employees &&
    prevProps.isAdmin === nextProps.isAdmin &&
    prevProps.userRole === nextProps.userRole
  );
});
