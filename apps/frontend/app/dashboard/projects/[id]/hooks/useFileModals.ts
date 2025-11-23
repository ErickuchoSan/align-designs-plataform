import { useCallback } from 'react';
import { useModal, useModalWithData } from '@/hooks/useModal';
import type { FileData } from './useProjectFiles';

export interface FileModalsState {
  showUploadModal: boolean;
  showCommentModal: boolean;
  showEditModal: boolean;
  showDeleteModal: boolean;
  fileToEdit: FileData | null;
  fileToDelete: FileData | null;
}

export interface FileModalsActions {
  openUploadModal: () => void;
  closeUploadModal: () => void;
  openCommentModal: () => void;
  closeCommentModal: () => void;
  openEditModal: (file: FileData) => void;
  closeEditModal: () => void;
  openDeleteModal: (file: FileData) => void;
  closeDeleteModal: () => void;
  closeAllModals: () => void;
}

export interface UseFileModalsReturn extends FileModalsState, FileModalsActions {}

/**
 * Hook to manage file-related modals state and actions
 * Extracts modal management logic from ProjectDetailsPage
 * Centralizes all modal open/close operations
 *
 * @returns Modal state and action handlers
 *
 * @example
 * function FileManager() {
 *   const {
 *     showUploadModal,
 *     openUploadModal,
 *     closeUploadModal,
 *     openEditModal,
 *     fileToEdit
 *   } = useFileModals();
 *
 *   return (
 *     <>
 *       <button onClick={openUploadModal}>Upload</button>
 *       <button onClick={() => openEditModal(file)}>Edit</button>
 *       {showUploadModal && <UploadModal onClose={closeUploadModal} />}
 *       {fileToEdit && <EditModal file={fileToEdit} />}
 *     </>
 *   );
 * }
 */
export function useFileModals(): UseFileModalsReturn {
  // Use generic modal hooks to reduce boilerplate
  const uploadModal = useModal();
  const commentModal = useModal();
  const editModal = useModalWithData<FileData>();
  const deleteModal = useModalWithData<FileData>();

  // Close all modals utility
  const closeAllModals = useCallback(() => {
    uploadModal.close();
    commentModal.close();
    editModal.close();
    deleteModal.close();
  }, [uploadModal, commentModal, editModal, deleteModal]);

  return {
    // State
    showUploadModal: uploadModal.isOpen,
    showCommentModal: commentModal.isOpen,
    showEditModal: editModal.isOpen,
    showDeleteModal: deleteModal.isOpen,
    fileToEdit: editModal.data,
    fileToDelete: deleteModal.data,
    // Actions
    openUploadModal: uploadModal.open,
    closeUploadModal: uploadModal.close,
    openCommentModal: commentModal.open,
    closeCommentModal: commentModal.close,
    openEditModal: editModal.open,
    closeEditModal: editModal.close,
    openDeleteModal: deleteModal.open,
    closeDeleteModal: deleteModal.close,
    closeAllModals,
  };
}
