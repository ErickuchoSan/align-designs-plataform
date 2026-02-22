'use client';

import { memo, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Project } from '@/types';

const ConfirmModal = dynamic(() => import('@/components/modals/ConfirmModal'), { ssr: false });

interface DeleteProjectModalProps {
  isOpen: boolean;
  project: Project | null;
  isDeleting: boolean;
  onClose: (show: boolean) => void;
  onProjectChange: (project: Project | null) => void;
  onConfirm: () => void;
}

function DeleteProjectModal({
  isOpen,
  project,
  isDeleting,
  onClose,
  onProjectChange,
  onConfirm,
}: DeleteProjectModalProps) {
  const hasPayments = Number(project?.amountPaid || 0) > 0;
  const hasEmployees = project?.employees && project.employees.length > 0;
  const showDetailedWarning = hasPayments || hasEmployees;

  const message = useMemo(() => {
    const baseMessage = `Are you sure you want to delete the project "${project?.name}"?`;
    if (!showDetailedWarning) {
      return baseMessage + ' This action cannot be undone.';
    }
    return baseMessage;
  }, [project?.name, showDetailedWarning]);

  const warningItems = useMemo(() => {
    if (!project) return [];

    const items = [];
    const amountPaid = Number(project.amountPaid || 0);

    if (amountPaid > 0) {
      items.push({
        label: 'Total Payments Received',
        value: `$${amountPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        icon: '💰',
      });
    }

    const employeeCount = project.employees?.length || 0;
    if (employeeCount > 0) {
      items.push({
        label: 'Assigned Employees',
        value: employeeCount,
        icon: '👥',
      });
    }

    if (amountPaid > 0) {
      items.push({
        label: 'Payment History',
        value: 'All payment records',
        icon: '📋',
      });
      items.push({
        label: 'Invoices',
        value: 'All invoice records',
        icon: '🧾',
      });
    }

    return items;
  }, [project]);

  return (
    <ConfirmModal
      isOpen={isOpen}
      onClose={() => {
        onClose(false);
        onProjectChange(null);
      }}
      onConfirm={onConfirm}
      title="Delete Project"
      message={message}
      confirmText="Delete"
      isLoading={isDeleting}
      variant="danger"
      showDetailedWarning={showDetailedWarning}
      warningItems={warningItems}
    />
  );
}

export default memo(DeleteProjectModal);
