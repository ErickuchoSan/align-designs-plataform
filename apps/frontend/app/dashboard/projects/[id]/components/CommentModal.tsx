import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { ButtonLoader } from '@/components/ui/Loader';
import { cn, TEXTAREA_BASE, INPUT_VARIANTS } from '@/lib/styles';

interface CommentModalProps {
  show: boolean;
  onClose: () => void;
  onSubmit: (comment: string, files: File[]) => Promise<boolean>;
  uploading: boolean;
}

export default function CommentModal({
  show,
  onClose,
  onSubmit,
  uploading,
}: Readonly<CommentModalProps>) {
  const [commentText, setCommentText] = useState('');
  const [files, setFiles] = useState<File[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() && files.length === 0) return; // Allow just files or just text? Usually need at least one.

    const success = await onSubmit(commentText, files);
    if (success) {
      handleClose();
    }
  };

  const handleClose = () => {
    setCommentText('');
    setFiles([]);
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  return (
    <Modal
      isOpen={show}
      onClose={handleClose}
      title="Create Feedback / Comment"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="commentText" className="block text-sm font-medium text-navy-900 mb-2">
            Comment
          </label>
          <textarea
            id="commentText"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Write your feedback..."
            rows={4}
            className={cn(TEXTAREA_BASE, INPUT_VARIANTS.default)}
          />
        </div>

        <div>
          <label htmlFor="attachments" className="block text-sm font-medium text-navy-900 mb-2">
            Attachments (Optional)
          </label>
          <input
            id="attachments"
            type="file"
            multiple
            onChange={handleFileChange}
            className="block w-full text-sm text-stone-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-navy-50 file:text-navy-700
              hover:file:bg-navy-100
            "
          />
          {files.length > 0 && (
            <div className="mt-2 text-sm text-stone-600">
              {files.length} file(s) selected
            </div>
          )}
        </div>

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
            disabled={uploading || (!commentText.trim() && files.length === 0)}
            className="flex items-center justify-center w-full px-5 py-2.5 text-sm font-medium text-white transition-all bg-gold-600 rounded-lg hover:bg-gold-700 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto sm:min-w-[120px]"
          >
            {uploading ? <ButtonLoader /> : 'Send Feedback'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
