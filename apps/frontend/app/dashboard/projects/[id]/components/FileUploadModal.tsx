import { useState } from 'react';
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

interface FileUploadModalProps {
  show: boolean;
  onClose: () => void;
  onUpload: (files: File[], comment: string) => Promise<boolean>;
  uploading: boolean;
  uploadProgress: number;
  error: string;
}

export default function FileUploadModal({
  show,
  onClose,
  onUpload,
  uploading,
  uploadProgress,
  error,
}: Readonly<FileUploadModalProps>) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadComment, setUploadComment] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0 || uploading) return;

    const success = await onUpload(selectedFiles, uploadComment);
    if (success) {
      handleClose();
    }
  };

  const handleClose = () => {
    setSelectedFiles([]);
    setUploadComment('');
    onClose();
  };

  return (
    <Modal
      isOpen={show}
      onClose={handleClose}
      title="Upload Files"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <ModalErrorAlert error={error} />

        <div>
          <label htmlFor="uploadFiles" className="block text-sm font-medium text-[#1B1C1A] mb-2">
            Select files
          </label>
          <FileInput
            id="uploadFiles"
            onChange={(files) => setSelectedFiles(files || [])}
            required
            multiple={true}
          />
          <FileListPreview files={selectedFiles} />
        </div>

        <div>
          <label htmlFor="uploadComment" className="block text-sm font-medium text-[#1B1C1A] mb-2">
            Comment (optional)
          </label>
          <textarea
            id="uploadComment"
            value={uploadComment}
            onChange={(e) => setUploadComment(e.target.value)}
            placeholder="Add a comment about this file..."
            rows={3}
            className={cn(TEXTAREA_BASE, INPUT_VARIANTS.default)}
          />
        </div>

        <UploadProgressBar uploading={uploading} progress={uploadProgress} />

        <div className="flex flex-col gap-2 pt-4 sm:flex-row sm:justify-end sm:gap-3">
          <ModalCancelButton onClick={handleClose} disabled={uploading} />
          <button
            type="submit"
            disabled={uploading || selectedFiles.length === 0}
            className="flex items-center justify-center w-full px-5 py-2.5 text-sm font-semibold text-white transition-all bg-gradient-to-br from-[#755B00] to-[#C9A84C] rounded-lg hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto sm:min-w-[120px]"
          >
            {uploading && <ButtonLoader />}
            {!uploading && (selectedFiles.length > 1 ? 'Upload Files' : 'Upload File')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
