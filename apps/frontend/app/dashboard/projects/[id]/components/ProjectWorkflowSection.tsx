'use client';

import { memo } from 'react';
import { Project } from '@/types';
import { useWorkflowData, ClientWorkflowView, AdminWorkflowView } from './workflow';

interface ProjectWorkflowSectionProps {
  project: Project;
  isAdmin: boolean;
  onUpdate: () => void;
  userRole?: string;
}

/**
 * ProjectWorkflowSection Component
 *
 * Displays and manages project workflow based on user role:
 * - Admin: Full workflow controls, employee management, payment tracking
 * - Client: Payment status and invoice information
 * - Employee: No workflow section (returns null)
 */
function ProjectWorkflowSection({
  project,
  isAdmin,
  onUpdate,
  userRole,
}: ProjectWorkflowSectionProps) {
  const workflowData = useWorkflowData(project, onUpdate);
  const isClient = userRole === 'CLIENT';

  // Employees don't see workflow section
  if (!isAdmin && !isClient) {
    return null;
  }

  // Client view
  if (isClient) {
    return (
      <ClientWorkflowView
        project={project}
        invoiceDeadlines={workflowData.invoiceDeadlines}
        pendingAmount={workflowData.pendingAmount}
        loadingInvoices={workflowData.loadingInvoices}
      />
    );
  }

  // Admin view
  return (
    <AdminWorkflowView
      project={project}
      invoiceDeadlines={workflowData.invoiceDeadlines}
      paymentProgress={workflowData.paymentProgress}
      payments={workflowData.payments}
      pendingAmount={workflowData.pendingAmount}
      loadingInvoices={workflowData.loadingInvoices}
      checklistData={workflowData.checklistData}
      processing={workflowData.processing}
      error={workflowData.error}
      onUpdate={onUpdate}
      onFetchCompletionStatus={workflowData.fetchCompletionStatus}
      onCompleteProject={workflowData.completeProject}
      onArchiveProject={workflowData.archiveProject}
    />
  );
}

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
