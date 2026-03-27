'use client';

import { memo, useMemo } from 'react';
import { Stage, ProjectStatus } from '@/types/enums';
import { StageInfo } from '@/types/stage';
import { ChevronRightIcon } from '@heroicons/react/24/outline';

interface NextStepIndicatorProps {
  stages: StageInfo[];
  projectStatus: ProjectStatus;
  userRole: string;
  hasUnpaidInvoices?: boolean;
  onAction?: () => void;
}

interface NextStep {
  label: string;
  description: string;
  actionLabel?: string;
  stage?: Stage;
  priority: 'high' | 'medium' | 'low';
}

/**
 * NextStepIndicator Component
 *
 * Shows the client what action they need to take next in the project workflow.
 * Examples:
 * - "Review Preliminary Design"
 * - "Approve Project Brief"
 * - "Review Plan Set"
 * - "Complete Payment"
 */
function NextStepIndicator({
  stages,
  projectStatus,
  userRole,
  hasUnpaidInvoices = false,
  onAction,
}: Readonly<NextStepIndicatorProps>) {
  const nextStep = useMemo((): NextStep | null => {
    // Priority 1: Payment required
    if (projectStatus === ProjectStatus.WAITING_PAYMENT) {
      return {
        label: 'Complete Initial Payment',
        description: 'Upload your payment proof to activate the project.',
        actionLabel: 'Upload Payment',
        priority: 'high',
      };
    }

    // Priority 2: Unpaid invoices
    if (hasUnpaidInvoices) {
      return {
        label: 'Pay Outstanding Invoice',
        description: 'You have an invoice pending payment.',
        actionLabel: 'View Invoice',
        stage: Stage.PAYMENTS,
        priority: 'high',
      };
    }

    // Priority 3: Project completed
    if (projectStatus === ProjectStatus.COMPLETED) {
      return {
        label: 'Project Complete',
        description: 'Your project has been completed. Download your final deliverables.',
        stage: Stage.CLIENT_APPROVED, // Final Deliverables
        priority: 'low',
      };
    }

    // Priority 4: Check stages for pending actions
    // Find stages with files that need client attention

    // Check Client Review (ADMIN_APPROVED) - Plan Set Review
    const clientReviewStage = stages.find(s => s.stage === Stage.ADMIN_APPROVED);
    if (clientReviewStage && clientReviewStage.fileCount > 0) {
      return {
        label: 'Review Plan Set',
        description: 'Your construction plans are ready for review.',
        actionLabel: 'View Plans',
        stage: Stage.ADMIN_APPROVED,
        priority: 'medium',
      };
    }

    // Check Concept Design (REFERENCES)
    const conceptDesignStage = stages.find(s => s.stage === Stage.REFERENCES);
    if (conceptDesignStage && conceptDesignStage.fileCount > 0) {
      return {
        label: 'Review Preliminary Design',
        description: 'Your concept design is ready for review.',
        actionLabel: 'View Design',
        stage: Stage.REFERENCES,
        priority: 'medium',
      };
    }

    // Check Project Brief approval
    const briefStage = stages.find(s => s.stage === Stage.BRIEF_PROJECT);
    if (briefStage && briefStage.fileCount > 0) {
      return {
        label: 'Review Project Brief',
        description: 'Review and confirm your project scope.',
        actionLabel: 'View Brief',
        stage: Stage.BRIEF_PROJECT,
        priority: 'medium',
      };
    }

    // Default: Project in progress
    return {
      label: 'Design In Progress',
      description: 'Your project is being worked on. We\'ll notify you when there\'s something to review.',
      priority: 'low',
    };
  }, [stages, projectStatus, hasUnpaidInvoices]);

  if (!nextStep) return null;

  // Don't show for admins or employees
  if (userRole !== 'CLIENT') return null;

  const priorityColors = {
    high: 'bg-amber-50 border-amber-200 text-amber-900',
    medium: 'bg-[#F5F4F0] border-[#D0C5B2]/20 text-[#1B1C1A]',
    low: 'bg-[#F5F4F0] border-[#D0C5B2]/20 text-[#6B6A65]',
  };

  const priorityBadge = {
    high: 'bg-amber-100 text-amber-800',
    medium: 'bg-[#C9A84C]/20 text-[#755B00]',
    low: 'bg-[#F5F4F0] text-[#6B6A65]',
  };

  return (
    <div className={`rounded-xl border p-4 mb-6 ${priorityColors[nextStep.priority]}`}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${priorityBadge[nextStep.priority]}`}>
              Next Step
            </span>
          </div>
          <h3 className="font-semibold text-lg">{nextStep.label}</h3>
          <p className="text-sm opacity-80 mt-1">{nextStep.description}</p>
        </div>

        {nextStep.actionLabel && (
          <button
            onClick={onAction}
            className="flex items-center gap-1 px-4 py-2 bg-gradient-to-br from-[#755B00] to-[#C9A84C] text-white rounded-lg hover:brightness-95 transition-all text-sm font-semibold shrink-0"
          >
            {nextStep.actionLabel}
            <ChevronRightIcon className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export default memo(NextStepIndicator);
