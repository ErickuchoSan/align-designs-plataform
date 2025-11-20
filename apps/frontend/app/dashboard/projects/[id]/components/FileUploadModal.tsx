import { useState } from 'react';
import Modal from '@/app/components/Modal';
import FileInput from '@/app/components/FileInput';
import { ButtonLoader } from '@/app/components/Loader';
import { formatFileSize } from '@/lib/utils/file.utils';

interface FileUploadModalProps {
  show: boolean;
  onClose: () => void;
  onUpload: (file: File, comment: string) => Promise<boolean>;
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadComment, setUploadComment] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || uploading) return;

    const success = await onUpload(selectedFile, uploadComment);
    if (success) {
      handleClose();
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setUploadComment('');
    onClose();
  };

  return (
    <Modal
      isOpen={show}
      onClose={handleClose}
      title="Upload File"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Error message in modal */}
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-navy-900 mb-2">
            Select file
          </label>
          <FileInput
            onChange={(file) => setSelectedFile(file)}
            required
          />
          {selectedFile && (
            <p className="mt-2 text-sm text-stone-700">
              Selected file: {selectedFile.name} ({formatFileSize(selectedFile.size)})
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-navy-900 mb-2">
            Comment (optional)
          </label>
          <textarea
            value={uploadComment}
            onChange={(e) => setUploadComment(e.target.value)}
            placeholder="Add a comment about this file..."
            rows={3}
            className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent resize-none text-navy-900 placeholder:text-stone-700"
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
            disabled={uploading || !selectedFile}
            className="px-5 py-2.5 text-sm font-medium text-white bg-navy-800 rounded-lg hover:bg-navy-700 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px] flex items-center justify-center"
          >
            {uploading ? <ButtonLoader /> : 'Upload File'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
