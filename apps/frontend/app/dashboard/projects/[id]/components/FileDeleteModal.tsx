import Modal from '@/components/ui/Modal';
import { ButtonLoader } from '@/components/ui/Loader';
import type { FileData } from '../hooks/useProjectFiles';

interface FileDeleteModalProps {
  show: boolean;
  onClose: () => void;
  onDelete: (file: FileData) => Promise<boolean>;
  file: FileData | null;
  deleting: boolean;
}

export default function FileDeleteModal({
  show,
  onClose,
  onDelete,
  file,
  deleting,
}: FileDeleteModalProps) {
  const handleDelete = async () => {
    if (!file) return;

    const success = await onDelete(file);
    if (success) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={show}
      onClose={onClose}
      title={file?.filename ? "Delete File" : "Delete Comment"}
      size="sm"
    >
      <div className="space-y-4">
        <p className="text-sm text-stone-700">
          {file?.filename ? (
            <>
              Are you sure you want to delete the file <strong>{file?.originalName}</strong>?
              This action cannot be undone.
            </>
          ) : (
            <>
              Are you sure you want to delete this comment?
              This action cannot be undone.
            </>
          )}
        </p>

        <div className="flex flex-col gap-2 pt-4 sm:flex-row sm:justify-end sm:gap-3">
          <button
            onClick={onClose}
            disabled={deleting}
            className="w-full px-5 py-2.5 text-sm font-medium text-navy-900 transition-colors bg-stone-200 rounded-lg hover:bg-stone-300 disabled:opacity-50 sm:w-auto"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center justify-center w-full px-5 py-2.5 text-sm font-medium text-white transition-all bg-red-600 rounded-lg hover:bg-red-700 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto sm:min-w-[100px]"
          >
            {deleting ? <ButtonLoader /> : 'Delete'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
