'use client';

import { memo } from 'react';
import { Stage, StageInfo } from '@/types/stage';
import type { File } from '@/types';

interface StageHeaderProps {
  stage: StageInfo;
  stageFiles: File[];
  userRole: string;
  onOpenUploadModal: (stage: Stage) => void;
  onOpenCommentModal: (stage: Stage) => void;
  onDownload: (fileId: string, fileName: string) => void;
}

/**
 * StageHeader Component
 * Renders the header section of a selected stage with action buttons
 * Extracted from ProjectStagesView for KISS compliance
 */
function StageHeader({
  stage,
  stageFiles,
  userRole,
  onOpenUploadModal,
  onOpenCommentModal,
  onDownload,
}: Readonly<StageHeaderProps>) {
  console.log('StageHeader rendered:', { stage: stage.stage, userRole, hasOnOpenCommentModal: !!onOpenCommentModal });

  const isAdmin = userRole === 'ADMIN';
  const isEmployee = userRole === 'EMPLOYEE';

  // Determine button visibility based on stage and role
  const showCommentButton = !(
    stage.stage === Stage.SUBMITTED ||
    stage.stage === Stage.FEEDBACK_EMPLOYEE ||
    stage.stage === Stage.PAYMENTS ||
    (stage.stage === Stage.BRIEF_PROJECT && isEmployee)
  );

  const showUploadButton =
    stage.permissions.canWrite &&
    !(isAdmin && stage.stage === Stage.SUBMITTED) &&
    stage.stage !== Stage.FEEDBACK_EMPLOYEE &&
    stage.stage !== Stage.PAYMENTS;

  const downloadableFiles = stageFiles.filter(f => f.filename);
  const showBulkDownload = downloadableFiles.length > 1;

  const handleBulkDownload = () => {
    downloadableFiles.forEach((file, index) => {
      setTimeout(() => {
        onDownload(file.id, file.originalName || `file-${index}`);
      }, index * 500);
    });
  };

  return (
    <div className="border-b border-stone-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl" aria-hidden="true">{stage.icon}</span>
            <h3 className="text-2xl font-bold text-navy-900">
              {stage.name}
            </h3>
          </div>
          <p className="text-sm text-stone-600">
            {stage.description}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          {showCommentButton && (
            <button
              onClick={() => {
                console.log('StageHeader: Create Comment clicked!', stage.stage);
                onOpenCommentModal(stage.stage);
              }}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-colors text-sm sm:text-base"
              aria-label={`Create comment in ${stage.name}`}
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <span className="whitespace-nowrap">Create Comment</span>
            </button>
          )}

          {showBulkDownload && (
            <button
              onClick={handleBulkDownload}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-lg font-medium transition-colors border border-stone-300 text-sm sm:text-base"
              aria-label={`Download all ${downloadableFiles.length} files from ${stage.name}`}
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span className="whitespace-nowrap">Download All</span>
            </button>
          )}

          {showUploadButton && (
            <button
              onClick={() => onOpenUploadModal(stage.stage)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-navy-800 hover:bg-navy-700 text-white rounded-lg font-medium transition-colors text-sm sm:text-base"
              aria-label={stage.stage === Stage.SUBMITTED ? 'Submit work' : `Upload file to ${stage.name}`}
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="whitespace-nowrap">
                {stage.stage === Stage.SUBMITTED ? 'Submit Work' : 'Upload File'}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(StageHeader);
