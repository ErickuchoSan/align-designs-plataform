'use client';

import { memo, useState } from 'react';
import { Stage, StageInfo } from '@/types/stage';
import type { File } from '@/types';
import StageFileItem from './StageFileItem';
import PaymentsStageContent from './PaymentsStageContent';
import { InlineSpinner } from '@/components/ui/Loader';
import { ProjectsService } from '@/services/projects.service';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

interface StageContentProps {
  stage: StageInfo;
  stageFiles: File[];
  filesLoading: boolean;
  userRole: string;
  userId: string;
  projectId: string;
  projectStatus: string;
  amountPaid: number;
  paymentRefreshKey: number;
  briefApprovedAt?: string;
  onDownload: (fileId: string, fileName: string) => void;
  onViewHistory: (file: File) => void;
  onEdit: (file: File) => void;
  onDelete: (file: File) => void;
  onOpenCommentModal: (stage: Stage, file?: File) => void;
  canDeleteFile: (file: File) => boolean;
  onGenerateInvoice: () => void;
  onPayEmployee: () => void;
  onUploadPaymentProof: () => void;
  onRefresh?: () => void;
  onBriefApproved?: () => void;
}

/**
 * StageContent Component
 * Renders the content area of a selected stage (files or payments)
 * Extracted from ProjectStagesView for KISS compliance
 */
function StageContent({
  stage,
  stageFiles,
  filesLoading,
  userRole,
  userId,
  projectId,
  projectStatus,
  amountPaid,
  paymentRefreshKey,
  briefApprovedAt,
  onDownload,
  onViewHistory,
  onEdit,
  onDelete,
  onOpenCommentModal,
  canDeleteFile,
  onGenerateInvoice,
  onPayEmployee,
  onUploadPaymentProof,
  onRefresh,
  onBriefApproved,
}: Readonly<StageContentProps>) {
  const [approvingBrief, setApprovingBrief] = useState(false);
  const [briefError, setBriefError] = useState<string | null>(null);

  const handleApproveBrief = async () => {
    setApprovingBrief(true);
    setBriefError(null);
    try {
      await ProjectsService.approveBrief(projectId);
      onBriefApproved?.();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to approve brief';
      setBriefError(message);
    } finally {
      setApprovingBrief(false);
    }
  };
  // Special handling for PAYMENTS stage
  if (stage.stage === Stage.PAYMENTS) {
    return (
      <div className="p-6">
        <PaymentsStageContent
          key={`payments-${projectStatus}-${amountPaid}-${paymentRefreshKey}`}
          projectId={projectId}
          userRole={userRole as 'ADMIN' | 'CLIENT' | 'EMPLOYEE'}
          userId={userId}
          onGenerateInvoice={onGenerateInvoice}
          onPayEmployee={onPayEmployee}
          onUploadPaymentProof={onUploadPaymentProof}
          onRefresh={onRefresh}
        />
      </div>
    );
  }

  // Loading state
  if (filesLoading) {
    return (
      <div className="p-6">
        <InlineSpinner label="Loading files" />
      </div>
    );
  }

  // Empty state
  if (stageFiles.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="text-6xl mb-4 opacity-20" aria-hidden="true">
            {stage.icon}
          </div>
          <p className="text-stone-600 mb-4">
            No files in this section yet
          </p>
          {stage.permissions.canWrite && (
            <p className="text-sm text-stone-500">
              Click the Upload File button above to add files
            </p>
          )}
        </div>
      </div>
    );
  }

  // Check if this is BRIEF_PROJECT stage and should show approval button
  const showBriefApproval = stage.stage === Stage.BRIEF_PROJECT &&
    userRole === 'CLIENT' &&
    stageFiles.length > 0;

  // Files list
  return (
    <div className="p-6">
      <ul className="space-y-3 list-none" aria-label={`Files in ${stage.name}`}>
        {stageFiles.map((file) => (
          <li key={file.id}>
            <StageFileItem
              file={file}
              stage={stage.stage}
              userRole={userRole}
              onDownload={onDownload}
              onViewHistory={onViewHistory}
              onEdit={onEdit}
              onDelete={onDelete}
              onOpenCommentModal={onOpenCommentModal}
              canDeleteFile={canDeleteFile}
            />
          </li>
        ))}
      </ul>

      {/* Brief Approval Section for Clients */}
      {showBriefApproval && (
        <div className="mt-6 pt-6 border-t border-stone-200">
          {briefApprovedAt ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
              <CheckCircleIcon className="w-6 h-6 text-green-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-green-800">Project Brief Approved</p>
                <p className="text-sm text-green-700">
                  Approved on {new Date(briefApprovedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-amber-900">Confirm Project Scope</p>
                  <p className="text-sm text-amber-800 mt-1">
                    Please review the project brief above and approve to confirm the project scope.
                    This action confirms that you agree with the project requirements.
                  </p>
                  {briefError && (
                    <p className="text-sm text-red-600 mt-2">{briefError}</p>
                  )}
                </div>
                <button
                  onClick={handleApproveBrief}
                  disabled={approvingBrief}
                  className="flex-shrink-0 px-4 py-2 bg-navy-800 text-white rounded-lg hover:bg-navy-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {approvingBrief ? (
                    <span className="flex items-center gap-2">
                      <InlineSpinner label="" />
                      Approving...
                    </span>
                  ) : (
                    'Approve Project Brief'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default memo(StageContent);
