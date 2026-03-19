import { memo } from 'react';
import { CloseIcon } from './icons';
import { formatFileSize } from '@/lib/utils/file.utils';

/**
 * Shared components for modals to reduce code duplication.
 * Used by: FileUploadModal, StageContentModal
 */

interface ErrorAlertProps {
  error: string;
}

/**
 * Error alert box for modal forms
 */
export const ModalErrorAlert = memo(function ModalErrorAlert({ error }: ErrorAlertProps) {
  if (!error) return null;

  return (
    <div className="rounded-lg bg-red-50 border border-red-200 p-4">
      <div className="flex items-center">
        <CloseIcon className="w-5 h-5 text-red-600 mr-3" />
        <p className="text-sm font-medium text-red-800">{error}</p>
      </div>
    </div>
  );
});

interface FileListPreviewProps {
  files: File[];
}

/**
 * Preview list of selected files with size
 */
export const FileListPreview = memo(function FileListPreview({ files }: FileListPreviewProps) {
  if (files.length === 0) return null;

  return (
    <div className="mt-2 text-sm text-stone-700 max-h-32 overflow-y-auto">
      <p className="font-medium mb-1">{files.length} file(s) selected:</p>
      <ul className="list-disc list-inside">
        {files.map((file) => (
          <li key={`${file.name}-${file.size}-${file.lastModified}`} className="truncate">
            {file.name} ({formatFileSize(file.size)})
          </li>
        ))}
      </ul>
    </div>
  );
});

interface UploadProgressBarProps {
  uploading: boolean;
  progress: number;
}

/**
 * Upload progress bar with percentage
 */
export const UploadProgressBar = memo(function UploadProgressBar({
  uploading,
  progress,
}: UploadProgressBarProps) {
  if (!uploading || progress <= 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm text-navy-900">
        <span>Uploading...</span>
        <span className="font-medium">{progress}%</span>
      </div>
      <div className="w-full bg-stone-200 rounded-full h-2 overflow-hidden">
        <div
          className="bg-navy-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
});

interface ModalCancelButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

/**
 * Standard cancel button for modal forms
 */
export const ModalCancelButton = memo(function ModalCancelButton({
  onClick,
  disabled = false,
}: ModalCancelButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full px-5 py-2.5 text-sm font-medium text-navy-900 transition-colors bg-stone-200 rounded-lg hover:bg-stone-300 disabled:opacity-50 sm:w-auto"
    >
      Cancel
    </button>
  );
});