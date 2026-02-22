'use client';

import { memo } from 'react';
import type { File } from '@/types';
import { Stage } from '@/types/stage';
import { CheckIcon, CloseIcon } from '@/components/ui/icons';

interface StageFileItemProps {
  file: File;
  stage: Stage;
  userRole: string;
  onDownload: (fileId: string, fileName: string) => void;
  onViewHistory: (file: File) => void;
  onEdit: (file: File) => void;
  onDelete: (file: File) => void;
  onOpenCommentModal: (stage: Stage, file?: File) => void;
  canDeleteFile: (file: File) => boolean;
}

function StageFileItem({
  file,
  stage,
  userRole,
  onDownload,
  onViewHistory,
  onEdit,
  onDelete,
  onOpenCommentModal,
  canDeleteFile,
}: StageFileItemProps) {
  const isAdmin = userRole === 'ADMIN';
  const isEmployee = userRole === 'EMPLOYEE';
  const isSubmittedStage = stage === Stage.SUBMITTED;
  const hasRejections = file.rejectionCount && file.rejectionCount > 0;

  return (
    <div className="flex items-center justify-between p-4 bg-stone-50 rounded-lg hover:bg-stone-100 transition-colors">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* File Icon */}
        <div className="flex-shrink-0 w-10 h-10 bg-navy-100 rounded-lg flex items-center justify-center">
          <svg
            className="w-6 h-6 text-navy-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
        </div>

        {/* File Info */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-stone-900 truncate">{file.originalName}</p>
          <p className="text-sm text-stone-500">
            {file.uploader && `${file.uploader.firstName} ${file.uploader.lastName}`} •{' '}
            {new Date(file.uploadedAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* File Actions */}
      <div className="flex items-center gap-2">
        {/* Download Button */}
        {file.filename && (
          <button
            onClick={() => onDownload(file.id, file.originalName || 'file')}
            className="p-2 text-stone-600 hover:text-navy-600 hover:bg-stone-200 rounded-lg transition-colors"
            title="Download"
            aria-label={`Download ${file.originalName}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
          </button>
        )}

        {/* View History Button */}
        <button
          onClick={() => onViewHistory(file)}
          className="p-2 text-stone-600 hover:text-navy-600 hover:bg-stone-200 rounded-lg transition-colors"
          title="View Comments"
          aria-label={`View comments for ${file.originalName}`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </button>

        {/* Standard Edit - Hidden for Admin in SUBMITTED, and Hidden for Employee always */}
        {!(isAdmin && isSubmittedStage) && !isEmployee && (
          <button
            onClick={() => onEdit(file)}
            className="p-2 text-stone-600 hover:text-amber-600 hover:bg-stone-200 rounded-lg transition-colors"
            title="Edit"
            aria-label={`Edit ${file.originalName}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>
        )}

        {/* Special Admin Actions in SUBMITTED */}
        {isAdmin && isSubmittedStage && (
          <>
            {!hasRejections && (
              <button
                onClick={() => onEdit(file)}
                className="p-2 text-stone-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                title="Approve (Move to Admin Approved)"
                aria-label={`Approve ${file.originalName}`}
              >
                <CheckIcon size="md" />
              </button>
            )}

            <button
              onClick={() => {
                if (!hasRejections) {
                  onOpenCommentModal(Stage.FEEDBACK_EMPLOYEE, file);
                }
              }}
              className={`p-2 rounded-lg transition-colors ${
                hasRejections
                  ? 'text-red-600 bg-red-50 cursor-default opacity-80'
                  : 'text-stone-600 hover:text-red-600 hover:bg-red-50'
              }`}
              disabled={!!hasRejections}
              title={hasRejections ? `Rejected (${file.rejectionCount} times)` : 'Reject (Create Feedback)'}
              aria-label={
                hasRejections
                  ? `Already rejected ${file.rejectionCount} times`
                  : `Reject ${file.originalName}`
              }
            >
              {hasRejections ? (
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z" />
                </svg>
              ) : (
                <CloseIcon size="md" />
              )}
            </button>
          </>
        )}

        {/* Delete Button */}
        {canDeleteFile(file) && !(isAdmin && isSubmittedStage) && !isEmployee && (
          <button
            onClick={() => onDelete(file)}
            className="p-2 text-stone-600 hover:text-red-600 hover:bg-stone-200 rounded-lg transition-colors"
            title="Delete"
            aria-label={`Delete ${file.originalName}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

export default memo(StageFileItem);
