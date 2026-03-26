'use client';

import { memo, useMemo } from 'react';
import { formatDate } from '@/lib/utils/date.utils';
import { sanitizeText } from '@/lib/utils/text.utils';
import { formatFileSize, getFileExtension } from '@/lib/utils/file.utils';
import type { FileData } from '../hooks/useProjectFiles';

interface MobileFileCardProps {
  file: FileData;
  onDownload: (fileId: string, fileName: string) => void;
  onEdit: (file: FileData) => void;
  onDelete: (file: FileData) => void;
  canDelete: (file: FileData) => boolean;
  onViewHistory: (file: FileData) => void;
  onUploadVersion: (file: FileData) => void;
}

function MobileFileCard({
  file,
  onDownload,
  onEdit,
  onDelete,
  canDelete,
  onViewHistory,
  onUploadVersion,
}: Readonly<MobileFileCardProps>) {
  const formattedDate = useMemo(() => formatDate(file.uploadedAt), [file.uploadedAt]);
  const formattedSize = useMemo(() => formatFileSize(file.sizeBytes || 0), [file.sizeBytes]);
  const fileExtension = useMemo(() => getFileExtension(file.originalName || ''), [file.originalName]);
  const uploaderName = useMemo(
    () => (file.uploader ? `${file.uploader.firstName} ${file.uploader.lastName}` : 'Unknown'),
    [file.uploader]
  );

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-stone-200 p-4">
      {/* File Header */}
      <div className="flex items-start gap-3 mb-3 pb-3 border-b border-stone-200">
        <div className="flex-shrink-0">
          {file.filename ? (
            <div className="w-10 h-10 rounded-lg bg-navy-100 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-navy-700"
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
          ) : (
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-blue-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-navy-900 break-words">
            {file.filename ? file.originalName : 'Comment Only'}
          </div>
          <div className="flex items-center gap-2 mt-1">
            {file.filename ? (
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-navy-100 text-navy-800">
                {fileExtension}
              </span>
            ) : (
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                COMMENT
              </span>
            )}
            {file.filename && <span className="text-xs text-gray-500">{formattedSize}</span>}
          </div>
        </div>
      </div>

      {/* File Details */}
      {file.comment && (
        <div className="mb-3 pb-3 border-b border-stone-200">
          <div className="text-xs text-gray-500 mb-1">Comment</div>
          <div className="text-sm text-stone-700 line-clamp-2">{sanitizeText(file.comment)}</div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
        <div>
          <div className="text-gray-500">Uploaded by</div>
          <div className="text-sm text-stone-900 font-medium">{uploaderName}</div>
        </div>
        <div>
          <div className="text-gray-500">Date</div>
          <div className="text-sm text-stone-900">{formattedDate}</div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 pt-3 border-t border-stone-200">
        {file.filename && (
          <>
            <ActionButton
              onClick={() => onDownload(file.id, file.originalName ?? '')}
              icon="download"
              label="Download"
              ariaLabel={`Download ${file.originalName}`}
            />
            <ActionButton
              onClick={() => onViewHistory(file)}
              icon="history"
              label="History"
              ariaLabel={`View history for ${file.originalName}`}
            />
            <ActionButton
              onClick={() => onUploadVersion(file)}
              icon="upload"
              label="Upload"
              ariaLabel={`Upload new version of ${file.originalName}`}
            />
          </>
        )}
        <ActionButton
          onClick={() => onEdit(file)}
          icon="edit"
          label="Edit"
          ariaLabel={`Edit ${file.originalName || 'comment'}`}
        />
        {canDelete(file) && (
          <ActionButton
            onClick={() => onDelete(file)}
            icon="delete"
            label="Delete"
            ariaLabel={`Delete ${file.originalName || 'comment'}`}
            variant="danger"
          />
        )}
      </div>
    </div>
  );
}

// Reusable action button component
const ActionButton = memo(function ActionButton({
  onClick,
  icon,
  label,
  ariaLabel,
  variant = 'default',
}: {
  onClick: () => void;
  icon: 'download' | 'history' | 'upload' | 'edit' | 'delete';
  label: string;
  ariaLabel: string;
  variant?: 'default' | 'danger';
}) {
  const iconPaths: Record<string, string> = {
    download: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4',
    history: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    upload: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12',
    edit: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
    delete:
      'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
  };

  const hoverColor = variant === 'danger' ? 'hover:text-red-600' : 'hover:text-navy-600';

  return (
    <button
      onClick={onClick}
      className={`flex-1 min-w-[calc(50%-0.25rem)] flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-stone-600 ${hoverColor} hover:bg-stone-50 rounded-lg transition-colors border border-stone-200`}
      aria-label={ariaLabel}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconPaths[icon]} />
      </svg>
      {label}
    </button>
  );
});

export default memo(MobileFileCard);
