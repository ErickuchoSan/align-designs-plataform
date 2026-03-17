import dynamic from 'next/dynamic';
import type { FileData } from '../hooks/useProjectFiles';

// Lazy load modals with dynamic imports for better code splitting
// These modals are only loaded when they are actually shown to the user
const FileUploadModal = dynamic(() => import('./FileUploadModal'), {
  loading: () => null, // Don't show loader for modals
  ssr: false, // Modals don't need SSR
});

const CommentModal = dynamic(() => import('./CommentModal'), {
  loading: () => null,
  ssr: false,
});

const FileEditModal = dynamic(() => import('./FileEditModal'), {
  loading: () => null,
  ssr: false,
});

const FileDeleteModal = dynamic(() => import('./FileDeleteModal'), {
  loading: () => null,
  ssr: false,
});

const FileVersionHistoryModal = dynamic(() => import('@/components/dashboard/FileVersionHistoryModal'), {
  loading: () => null,
  ssr: false,
});

const UploadNewVersionModal = dynamic(() => import('@/components/dashboard/UploadNewVersionModal'), {
  loading: () => null,
  ssr: false,
});

interface FileModalsGroupProps {
  // Upload Modal
  showUploadModal: boolean;
  onCloseUploadModal: () => void;
  onUpload: (files: File[], comment: string) => Promise<boolean>;
  uploading: boolean;
  uploadProgress: number;
  uploadError: string;
  onClearError: () => void;

  // Comment Modal
  showCommentModal: boolean;
  onCloseCommentModal: () => void;
  onSubmitComment: (comment: string, files: File[]) => Promise<boolean>;

  // Edit Modal
  showEditModal: boolean;
  onCloseEditModal: () => void;
  onEdit: (fileToEdit: FileData, comment: string, files: File[]) => Promise<boolean>;
  fileToEdit: FileData | null;

  // Delete Modal
  showDeleteModal: boolean;
  onCloseDeleteModal: () => void;
  onDelete: (file: FileData) => Promise<boolean>;
  fileToDelete: FileData | null;
  deleting: boolean;
  // History Modal
  showHistoryModal: boolean;
  onCloseHistoryModal: () => void;
  fileToViewHistory: FileData | null;
  // Upload Version Modal
  showUploadVersionModal: boolean;
  onCloseUploadVersionModal: () => void;
  onUploadVersion: () => void; // Trigger refresh
  fileToVersion: FileData | null;
}

/**
 * Groups all file-related modals into a single component
 * Reduces complexity in the main ProjectDetailsPage component
 */
export default function FileModalsGroup({
  showUploadModal,
  onCloseUploadModal,
  onUpload,
  uploading,
  uploadProgress,
  uploadError,
  onClearError,
  showCommentModal,
  onCloseCommentModal,
  onSubmitComment,
  showEditModal,
  onCloseEditModal,
  onEdit,
  fileToEdit,
  showDeleteModal,
  onCloseDeleteModal,
  onDelete,
  fileToDelete,
  deleting,
  showHistoryModal,
  onCloseHistoryModal,
  fileToViewHistory,
  showUploadVersionModal,
  onCloseUploadVersionModal,
  onUploadVersion,
  fileToVersion,
}: Readonly<FileModalsGroupProps>) {
  return (
    <>
      <FileUploadModal
        show={showUploadModal}
        onClose={() => {
          onCloseUploadModal();
          onClearError();
        }}
        onUpload={onUpload}
        uploading={uploading}
        uploadProgress={uploadProgress}
        error={uploadError}
      />

      <CommentModal
        show={showCommentModal}
        onClose={onCloseCommentModal}
        onSubmit={onSubmitComment}
        uploading={uploading}
      />

      <FileEditModal
        show={showEditModal}
        onClose={onCloseEditModal}
        onEdit={onEdit}
        file={fileToEdit}
        uploading={uploading}
      />

      <FileDeleteModal
        show={showDeleteModal}
        onClose={onCloseDeleteModal}
        onDelete={onDelete}
        file={fileToDelete}
        deleting={deleting}
      />

      {fileToViewHistory && (
        <FileVersionHistoryModal
          isOpen={showHistoryModal}
          onClose={onCloseHistoryModal}
          file={fileToViewHistory}
          onDownload={() => { }} // Placeholder or pass handler
        />
      )}

      {fileToVersion && (
        <UploadNewVersionModal
          isOpen={showUploadVersionModal}
          onClose={onCloseUploadVersionModal}
          parentFileId={fileToVersion.id}
          projectId={fileToVersion.id} // Not really needed if parentFileId is enough
          onSuccess={onUploadVersion}
        />
      )}
    </>
  );
}
