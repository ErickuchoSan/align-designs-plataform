import { useState, useCallback } from 'react';
import Modal from '@/components/ui/Modal';
import FileInput from '@/components/ui/inputs/FileInput';
import { ButtonLoader } from '@/components/ui/Loader';
import { formatFileSize } from '@/lib/utils/file.utils';
import { cn, TEXTAREA_BASE, INPUT_VARIANTS } from '@/lib/styles';
import { CloseIcon } from '@/components/ui/icons';

type ContentMode = 'comment' | 'file' | 'both';

interface StageContentModalProps {
  show: boolean;
  onClose: () => void;
  onSubmit: (data: { comment: string; files: File[] }) => Promise<boolean>;
  uploading: boolean;
  uploadProgress: number;
  error: string;
  stageName?: string;
}

/**
 * Unified modal for adding content to a stage
 * Supports: comment only, file only, or file with comment
 */
export default function StageContentModal({
  show,
  onClose,
  onSubmit,
  uploading,
  uploadProgress,
  error,
  stageName,
}: Readonly<StageContentModalProps>) {
  const [contentMode, setContentMode] = useState<ContentMode>('comment');
  const [commentText, setCommentText] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate based on mode
    if (contentMode === 'comment' && !commentText.trim()) return;
    if (contentMode === 'file' && selectedFiles.length === 0) return;
    if (contentMode === 'both' && selectedFiles.length === 0) return;

    const success = await onSubmit({
      comment: commentText,
      files: selectedFiles,
    });

    if (success) {
      handleClose();
    }
  };

  const handleClose = useCallback(() => {
    setCommentText('');
    setSelectedFiles([]);
    setContentMode('comment');
    onClose();
  }, [onClose]);

  const isValid = (): boolean => {
    if (contentMode === 'comment') return commentText.trim().length > 0;
    if (contentMode === 'file') return selectedFiles.length > 0;
    if (contentMode === 'both') return selectedFiles.length > 0;
    return false;
  };

  const getSubmitButtonText = (): string => {
    if (uploading) return '';
    if (contentMode === 'comment') return 'Send Comment';
    if (contentMode === 'file') return selectedFiles.length > 1 ? 'Upload Files' : 'Upload File';
    return 'Upload with Comment';
  };

  return (
    <Modal
      isOpen={show}
      onClose={handleClose}
      title={stageName ? `Add to ${stageName}` : 'Add Content'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Error message */}
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4">
            <div className="flex items-center">
              <CloseIcon className="w-5 h-5 text-red-600 mr-3" />
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Content Mode Selector */}
        <div className="flex rounded-lg bg-stone-100 p-1">
          <button
            type="button"
            onClick={() => setContentMode('comment')}
            className={cn(
              'flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors',
              contentMode === 'comment'
                ? 'bg-white text-navy-900 shadow-sm'
                : 'text-stone-600 hover:text-navy-900'
            )}
          >
            Comment Only
          </button>
          <button
            type="button"
            onClick={() => setContentMode('file')}
            className={cn(
              'flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors',
              contentMode === 'file'
                ? 'bg-white text-navy-900 shadow-sm'
                : 'text-stone-600 hover:text-navy-900'
            )}
          >
            File Only
          </button>
          <button
            type="button"
            onClick={() => setContentMode('both')}
            className={cn(
              'flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors',
              contentMode === 'both'
                ? 'bg-white text-navy-900 shadow-sm'
                : 'text-stone-600 hover:text-navy-900'
            )}
          >
            File + Comment
          </button>
        </div>

        {/* Comment Field - shown for 'comment' and 'both' modes */}
        {(contentMode === 'comment' || contentMode === 'both') && (
          <div>
            <label htmlFor="commentText" className="block text-sm font-medium text-navy-900 mb-2">
              {contentMode === 'both' ? 'Comment' : 'Your Comment'}
            </label>
            <textarea
              id="commentText"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={contentMode === 'both' ? 'Add a comment about this file...' : 'Write your feedback or comment...'}
              rows={contentMode === 'both' ? 3 : 4}
              className={cn(TEXTAREA_BASE, INPUT_VARIANTS.default)}
            />
          </div>
        )}

        {/* File Input - shown for 'file' and 'both' modes */}
        {(contentMode === 'file' || contentMode === 'both') && (
          <div>
            <label htmlFor="uploadFiles" className="block text-sm font-medium text-navy-900 mb-2">
              Select Files
            </label>
            <FileInput
              id="uploadFiles"
              onChange={(files) => setSelectedFiles(files || [])}
              required
              multiple={true}
            />
            {selectedFiles.length > 0 && (
              <div className="mt-2 text-sm text-stone-700 max-h-32 overflow-y-auto">
                <p className="font-medium mb-1">{selectedFiles.length} file(s) selected:</p>
                <ul className="list-disc list-inside">
                  {selectedFiles.map((file) => (
                    <li key={`${file.name}-${file.size}-${file.lastModified}`} className="truncate">
                      {file.name} ({formatFileSize(file.size)})
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Upload Progress Bar */}
        {uploading && uploadProgress > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-navy-900">
              <span>Uploading...</span>
              <span className="font-medium">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-stone-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-navy-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2 pt-4 sm:flex-row sm:justify-end sm:gap-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={uploading}
            className="w-full px-5 py-2.5 text-sm font-medium text-navy-900 transition-colors bg-stone-200 rounded-lg hover:bg-stone-300 disabled:opacity-50 sm:w-auto"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={uploading || !isValid()}
            className={cn(
              'flex items-center justify-center w-full px-5 py-2.5 text-sm font-medium text-white transition-all rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto sm:min-w-[140px]',
              contentMode === 'comment'
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-navy-800 hover:bg-navy-700'
            )}
          >
            {uploading ? <ButtonLoader /> : getSubmitButtonText()}
          </button>
        </div>
      </form>
    </Modal>
  );
}
