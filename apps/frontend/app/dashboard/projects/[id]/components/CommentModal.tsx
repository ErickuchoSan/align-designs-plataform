import { useState } from 'react';
import Modal from '@/app/components/Modal';
import { ButtonLoader } from '@/app/components/Loader';

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
}: CommentModalProps) {
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
          <label className="block text-sm font-medium text-navy-900 mb-2">
            Comment
          </label>
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Write your feedback..."
            rows={4}
            className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent resize-none text-navy-900 placeholder:text-stone-700"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-navy-900 mb-2">
            Attachments (Optional)
          </label>
          <input
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

        <div className="flex gap-3 justify-end pt-4">
          <button
            type="button"
            onClick={handleClose}
            disabled={uploading}
            className="px-5 py-2.5 text-sm font-medium text-navy-900 bg-stone-200 rounded-lg hover:bg-stone-300 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={uploading || (!commentText.trim() && files.length === 0)}
            className="px-5 py-2.5 text-sm font-medium text-white bg-gold-600 rounded-lg hover:bg-gold-700 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px] flex items-center justify-center"
          >
            {uploading ? <ButtonLoader /> : 'Send Feedback'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
