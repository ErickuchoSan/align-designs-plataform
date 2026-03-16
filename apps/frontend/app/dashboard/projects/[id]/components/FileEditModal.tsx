import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import FileInput from '@/components/ui/inputs/FileInput';
import { ButtonLoader } from '@/components/ui/Loader';
import { formatFileSize } from '@/lib/utils/file.utils';
import type { FileData } from '../hooks/useProjectFiles';
import { cn, TEXTAREA_BASE, INPUT_VARIANTS } from '@/lib/styles';

interface FileEditModalProps {
  show: boolean;
  onClose: () => void;
  onEdit: (fileToEdit: FileData, editComment: string, editFiles: File[]) => Promise<boolean>;
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
  const [editFiles, setEditFiles] = useState<File[]>([]);

  useEffect(() => {
    if (file) {
      setEditComment(file.comment || '');
      setEditFiles([]);
    }
  }, [file]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    const success = await onEdit(file, editComment, editFiles);
    if (success) {
      handleClose();
    }
  };

  const handleClose = () => {
    setEditComment('');
    setEditFiles([]);
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
          <label htmlFor="editComment" className="block text-sm font-medium text-navy-900 mb-2">
            Comment
          </label>
          <textarea
            id="editComment"
            value={editComment}
            onChange={(e) => setEditComment(e.target.value)}
            placeholder="Write a comment..."
            rows={3}
            className={cn(TEXTAREA_BASE, INPUT_VARIANTS.default)}
          />
          <p className="mt-1 text-xs text-stone-700">
            Leave empty to remove the comment
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-navy-900 mb-2">
            {file?.filename ? 'Replace file & Add more (optional)' : 'Add files (optional)'}
          </label>
          {file?.filename && (
            <p className="mb-2 text-sm text-stone-700">
              Current file: <span className="font-semibold">{file.originalName}</span>
            </p>
          )}
          <FileInput
            onChange={(files) => setEditFiles(files || [])}
            placeholder="No files selected"
            multiple={true}
          />
          {editFiles.length > 0 && (
            <div className="mt-2 text-sm text-stone-700 max-h-32 overflow-y-auto">
              <p className="font-medium mb-1 text-emerald-700">{editFiles.length} new file(s) selected:</p>
              <ul className="list-disc list-inside">
                {editFiles.map((f, idx) => (
                  <li key={`${f.name}-${f.size}-${f.lastModified}`} className="truncate">
                    {idx === 0 && file?.filename ?
                      <span className="font-semibold text-amber-700">[Replaces Current] </span> :
                      <span className="font-semibold text-blue-700">[New Entry] </span>
                    }
                    {f.name} ({formatFileSize(f.size)})
                  </li>
                ))}
              </ul>
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
            disabled={uploading}
            className="flex items-center justify-center w-full px-5 py-2.5 text-sm font-medium text-white transition-all bg-navy-800 rounded-lg hover:bg-navy-700 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto sm:min-w-[120px]"
          >
            {uploading ? <ButtonLoader /> : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
