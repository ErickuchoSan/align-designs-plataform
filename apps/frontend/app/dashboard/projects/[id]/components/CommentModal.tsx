import { useState } from 'react';
import Modal from '@/app/components/Modal';
import { ButtonLoader } from '@/app/components/Loader';

interface CommentModalProps {
  show: boolean;
  onClose: () => void;
  onSubmit: (comment: string) => Promise<boolean>;
  uploading: boolean;
}

export default function CommentModal({
  show,
  onClose,
  onSubmit,
  uploading,
}: CommentModalProps) {
  const [commentText, setCommentText] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const success = await onSubmit(commentText);
    if (success) {
      handleClose();
    }
  };

  const handleClose = () => {
    setCommentText('');
    onClose();
  };

  return (
    <Modal
      isOpen={show}
      onClose={handleClose}
      title="Create Comment"
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
            placeholder="Write your comment..."
            rows={4}
            className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent resize-none text-navy-900 placeholder:text-stone-700"
            required
          />
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
            disabled={uploading || !commentText.trim()}
            className="px-5 py-2.5 text-sm font-medium text-white bg-gold-600 rounded-lg hover:bg-gold-700 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px] flex items-center justify-center"
          >
            {uploading ? <ButtonLoader /> : 'Create Comment'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
