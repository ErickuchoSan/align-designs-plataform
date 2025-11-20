import { useState, useEffect } from 'react';
import Modal from '@/app/components/Modal';
import FileInput from '@/app/components/FileInput';
import { ButtonLoader } from '@/app/components/Loader';
import { formatFileSize } from '@/lib/utils/file.utils';
import type { FileData } from '../hooks/useProjectFiles';

interface FileEditModalProps {
  show: boolean;
  onClose: () => void;
  onEdit: (fileToEdit: FileData, editComment: string, editFile: File | null) => Promise<boolean>;
  file: FileData | null;
  uploading: boolean;
}

export default function FileEditModal({
  show,
  onClose,
  onEdit,
  file,
  uploading,
}: FileEditModalProps) {
  const [editComment, setEditComment] = useState('');
  const [editFile, setEditFile] = useState<File | null>(null);

  useEffect(() => {
    if (file) {
      setEditComment(file.comment || '');
      setEditFile(null);
    }
  }, [file]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    const success = await onEdit(file, editComment, editFile);
    if (success) {
      handleClose();
    }
  };

  const handleClose = () => {
    setEditComment('');
    setEditFile(null);
    onClose();
  };

  return (
    <Modal
      isOpen={show}
      onClose={handleClose}
      title="Edit Entry"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-navy-900 mb-2">
            Comment
          </label>
          <textarea
            value={editComment}
            onChange={(e) => setEditComment(e.target.value)}
            placeholder="Write a comment..."
            rows={3}
            className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent resize-none text-navy-900 placeholder:text-stone-700"
          />
          <p className="mt-1 text-xs text-stone-700">
            Leave empty to remove the comment
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-navy-900 mb-2">
            {file?.filename ? 'Replace file (optional)' : 'Add file (optional)'}
          </label>
          {file?.filename && (
            <p className="mb-2 text-sm text-stone-700">
              Current file: <span className="font-semibold">{file.originalName}</span>
            </p>
          )}
          <FileInput
            onChange={(file) => setEditFile(file)}
            placeholder="No file selected"
          />
          {editFile && (
            <p className="mt-2 text-sm text-emerald-700 font-medium">
              New file: {editFile.name} ({formatFileSize(editFile.size)})
            </p>
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
            disabled={uploading}
            className="px-5 py-2.5 text-sm font-medium text-white bg-navy-800 rounded-lg hover:bg-navy-700 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px] flex items-center justify-center"
          >
            {uploading ? <ButtonLoader /> : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
