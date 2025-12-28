'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ManageEmployeesModal } from '@/components/dashboard/ManageEmployeesModal';
import { Project, ProjectStatus } from '@/types';
import { ProjectStatusBadge } from '@/components/projects/ProjectStatusBadge';
import { PaymentProgressBar } from '@/components/projects/PaymentProgressBar';
import { RecordPaymentModal } from '@/components/payments/RecordPaymentModal';
import { CompletionChecklistModal } from '@/components/projects/CompletionChecklistModal';
import { ProjectsService } from '@/services/projects.service';
import { logger } from '@/lib/logger';

interface ProjectWorkflowSectionProps {
  project: Project;
  isAdmin: boolean;
  onUpdate: () => void;
}

/**
 * ProjectWorkflowSection Component
 *
 * Displays and manages project workflow:
 * - Status overview with action buttons
 * - Employee assignments
 * - Payment tracking
 * - Deadline information
 *
 * Only visible to admins
 */
export default function ProjectWorkflowSection({
  project,
  isAdmin,
  onUpdate,
}: ProjectWorkflowSectionProps) {
  const router = useRouter();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  // Don't show workflow section to non-admins
  if (!isAdmin) {
    return null;
  }

  const handleActivateProject = useCallback(async () => {
    if (!confirm('Are you sure you want to activate this project?')) {
      return;
    }

    setProcessing(true);
    setError('');

    try {
      await ProjectsService.activate(project.id);
      onUpdate();
    } catch (err: any) {
      logger.error('Error activating project:', err);
      setError(err.response?.data?.message || 'Failed to activate project');
    } finally {
      setProcessing(false);
    }
  }, [project.id, onUpdate]);

  const handleCompleteProject = useCallback(async () => {
    if (!confirm('Are you sure you want to mark this project as completed?')) {
      return;
    }

    setProcessing(true);
    setError('');

    try {
      await ProjectsService.complete(project.id);
      onUpdate();
    } catch (err: any) {
      logger.error('Error completing project:', err);
      setError(err.response?.data?.message || 'Failed to complete project');
    } finally {
      setProcessing(false);
    }
  }, [project.id, onUpdate]);

  const [showChecklistModal, setShowChecklistModal] = useState(false);
  const [checklistData, setChecklistData] = useState<any>(null);
  const [checklistLoading, setChecklistLoading] = useState(false);

  // ... (Activate/Complete handlers remain same)

  const handleArchiveClick = useCallback(async () => {
    setChecklistLoading(true);
    setError('');

    try {
      const status = await ProjectsService.getCompletionStatus(project.id);
      setChecklistData(status);
      setShowChecklistModal(true);
    } catch (err: any) {
      logger.error('Error fetching completion status:', err);
      setError(err.response?.data?.message || 'Failed to fetch project status');
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
    } catch (err: any) {
      logger.error('Error archiving project:', err);
      setError(err.response?.data?.message || 'Failed to archive project');
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

  const canActivate = project.status === ProjectStatus.WAITING_PAYMENT;
  const canComplete = project.status === ProjectStatus.ACTIVE;
  const canArchive = project.status === ProjectStatus.COMPLETED;

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
        {canActivate && (
          <button
            onClick={handleActivateProject}
            disabled={processing}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Activate Project
          </button>
        )}
        {canComplete && (
          <button
            onClick={handleCompleteProject}
            disabled={processing}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
        <div className="border border-stone-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-navy-900">Payment Status</h3>
            <div className="flex gap-2">
              <button
                onClick={() => router.push(`/dashboard/projects/${project.id}/payments`)}
                className="text-sm px-3 py-1.5 border border-navy-200 text-navy-800 hover:bg-navy-50 rounded-lg font-medium transition-colors"
              >
                History
              </button>
              <button
                onClick={() => setShowPaymentModal(true)}
                className="text-sm px-3 py-1.5 bg-navy-800 hover:bg-navy-700 text-white rounded-lg font-medium transition-colors"
              >
                Record Payment
              </button>
            </div>
          </div>

          {project.initialAmountRequired !== null && project.initialAmountRequired !== undefined ? (
            <PaymentProgressBar
              paid={Number(project.amountPaid)}
              required={Number(project.initialAmountRequired)}
            />
          ) : (
            <p className="text-sm text-stone-600">No payment amount set</p>
          )}
        </div>

        {/* Deadline Section */}
        <div className="border border-stone-200 rounded-lg p-4">
          <h3 className="font-semibold text-navy-900 mb-3">Deadline</h3>
          {project.deadlineDate ? (
            <div>
              <p className="text-lg font-medium text-navy-900">
                {formatDate(project.deadlineDate)}
              </p>
              {new Date(project.deadlineDate) < new Date() && (
                <p className="text-sm text-red-600 mt-1">Overdue</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-stone-600">No deadline set</p>
          )}
        </div>

        {/* Employees Section */}
        <div className="border border-stone-200 rounded-lg p-4 md:col-span-2">
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
              {project.employees.map((assignment: any) => (
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

      <RecordPaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        projectId={project.id}
        onSuccess={onUpdate}
        initialAmount={
          project.initialAmountRequired && project.amountPaid
            ? Math.max(0, Number(project.initialAmountRequired) - Number(project.amountPaid))
            : 0
        }
      />

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
    </div>
  );
}
