import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import FileInput from '@/components/ui/inputs/FileInput';
import { ButtonLoader } from '@/components/ui/Loader';
import { formatFileSize } from '@/lib/utils/file.utils';
import { cn, TEXTAREA_BASE, INPUT_VARIANTS } from '@/lib/styles';
import { CloseIcon } from '@/components/ui/icons';

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
}: FileUploadModalProps) {
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
        {/* Error message in modal */}
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4">
            <div className="flex items-center">
              <CloseIcon className="w-5 h-5 text-red-600 mr-3" />
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          </div>
        )}

        <div>
          <label htmlFor="uploadFiles" className="block text-sm font-medium text-navy-900 mb-2">
            Select files
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

        <div>
          <label htmlFor="uploadComment" className="block text-sm font-medium text-navy-900 mb-2">
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
            disabled={uploading || selectedFiles.length === 0}
            className="flex items-center justify-center w-full px-5 py-2.5 text-sm font-medium text-white transition-all bg-navy-800 rounded-lg hover:bg-navy-700 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto sm:min-w-[120px]"
          >
            {uploading ? <ButtonLoader /> : (selectedFiles.length > 1 ? 'Upload Files' : 'Upload File')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
