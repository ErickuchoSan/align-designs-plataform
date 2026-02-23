'use client';

import { memo } from 'react';
import { Stage, StageInfo } from '@/types/stage';
import type { File } from '@/types';
import StageFileItem from './StageFileItem';
import PaymentsStageContent from './PaymentsStageContent';
import { InlineSpinner } from '@/components/ui/Loader';

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
}: StageContentProps) {
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

  // Files list
  return (
    <div className="p-6">
      <div className="space-y-3" role="list" aria-label={`Files in ${stage.name}`}>
        {stageFiles.map((file) => (
          <StageFileItem
            key={file.id}
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
        ))}
      </div>
    </div>
  );
}

export default memo(StageContent);
