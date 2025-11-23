import FileUploadModal from './FileUploadModal';
import CommentModal from './CommentModal';
import FileEditModal from './FileEditModal';
import FileDeleteModal from './FileDeleteModal';
import type { FileData } from '../hooks/useProjectFiles';

interface FileModalsGroupProps {
  // Upload Modal
  showUploadModal: boolean;
  onCloseUploadModal: () => void;
  onUpload: (file: File, comment: string) => Promise<boolean>;
  uploading: boolean;
  uploadProgress: number;
  uploadError: string;
  onClearError: () => void;

  // Comment Modal
  showCommentModal: boolean;
  onCloseCommentModal: () => void;
  onSubmitComment: (comment: string) => Promise<boolean>;

  // Edit Modal
  showEditModal: boolean;
  onCloseEditModal: () => void;
  onEdit: (fileToEdit: FileData, comment: string, file: File | null) => Promise<boolean>;
  fileToEdit: FileData | null;

  // Delete Modal
  showDeleteModal: boolean;
  onCloseDeleteModal: () => void;
  onDelete: (file: FileData) => Promise<boolean>;
  fileToDelete: FileData | null;
  deleting: boolean;
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
}: FileModalsGroupProps) {
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
    </>
  );
}
