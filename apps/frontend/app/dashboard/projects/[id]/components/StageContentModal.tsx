import { useState, useCallback } from 'react';
import Modal from '@/components/ui/Modal';
import FileInput from '@/components/ui/inputs/FileInput';
import { ButtonLoader } from '@/components/ui/Loader';
import { cn, TEXTAREA_BASE, INPUT_VARIANTS } from '@/lib/styles';
import {
  ModalErrorAlert,
  FileListPreview,
  UploadProgressBar,
  ModalCancelButton,
} from '@/components/ui/modal-shared';

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
        <ModalErrorAlert error={error} />

        {/* Content Mode Selector */}
        <div className="flex rounded-lg bg-[#F5F4F0] p-1">
          <button
            type="button"
            onClick={() => setContentMode('comment')}
            className={cn(
              'flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors',
              contentMode === 'comment'
                ? 'bg-white text-[#1B1C1A] shadow-sm'
                : 'text-[#6B6A65] hover:text-[#1B1C1A]'
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
                ? 'bg-white text-[#1B1C1A] shadow-sm'
                : 'text-[#6B6A65] hover:text-[#1B1C1A]'
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
                ? 'bg-white text-[#1B1C1A] shadow-sm'
                : 'text-[#6B6A65] hover:text-[#1B1C1A]'
            )}
          >
            File + Comment
          </button>
        </div>

        {/* Comment Field - shown for 'comment' and 'both' modes */}
        {(contentMode === 'comment' || contentMode === 'both') && (
          <div>
            <label htmlFor="commentText" className="block text-sm font-medium text-[#1B1C1A] mb-2">
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
            <label htmlFor="uploadFiles" className="block text-sm font-medium text-[#1B1C1A] mb-2">
              Select Files
            </label>
            <FileInput
              id="uploadFiles"
              onChange={(files) => setSelectedFiles(files || [])}
              required
              multiple={true}
            />
            <FileListPreview files={selectedFiles} />
          </div>
        )}

        <UploadProgressBar uploading={uploading} progress={uploadProgress} />

        {/* Actions */}
        <div className="flex flex-col gap-2 pt-4 sm:flex-row sm:justify-end sm:gap-3">
          <ModalCancelButton onClick={handleClose} disabled={uploading} />
          <button
            type="submit"
            disabled={uploading || !isValid()}
            className={cn(
              'flex items-center justify-center w-full px-5 py-2.5 text-sm font-medium text-white transition-all rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto sm:min-w-[140px]',
              contentMode === 'comment'
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-gradient-to-br from-[#755B00] to-[#C9A84C] hover:brightness-95'
            )}
          >
            {uploading ? <ButtonLoader /> : getSubmitButtonText()}
          </button>
        </div>
      </form>
    </Modal>
  );
}
