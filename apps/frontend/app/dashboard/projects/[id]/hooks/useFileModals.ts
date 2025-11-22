import { useState, useCallback } from 'react';
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
  // Modal visibility states
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Modal data states
  const [fileToEdit, setFileToEdit] = useState<FileData | null>(null);
  const [fileToDelete, setFileToDelete] = useState<FileData | null>(null);

  // Upload modal handlers
  const openUploadModal = useCallback(() => setShowUploadModal(true), []);
  const closeUploadModal = useCallback(() => setShowUploadModal(false), []);

  // Comment modal handlers
  const openCommentModal = useCallback(() => setShowCommentModal(true), []);
  const closeCommentModal = useCallback(() => setShowCommentModal(false), []);

  // Edit modal handlers
  const openEditModal = useCallback((file: FileData) => {
    setFileToEdit(file);
    setShowEditModal(true);
  }, []);

  const closeEditModal = useCallback(() => {
    setShowEditModal(false);
    setFileToEdit(null);
  }, []);

  // Delete modal handlers
  const openDeleteModal = useCallback((file: FileData) => {
    setFileToDelete(file);
    setShowDeleteModal(true);
  }, []);

  const closeDeleteModal = useCallback(() => {
    setShowDeleteModal(false);
    setFileToDelete(null);
  }, []);

  // Close all modals utility
  const closeAllModals = useCallback(() => {
    setShowUploadModal(false);
    setShowCommentModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
    setFileToEdit(null);
    setFileToDelete(null);
  }, []);

  return {
    // State
    showUploadModal,
    showCommentModal,
    showEditModal,
    showDeleteModal,
    fileToEdit,
    fileToDelete,
    // Actions
    openUploadModal,
    closeUploadModal,
    openCommentModal,
    closeCommentModal,
    openEditModal,
    closeEditModal,
    openDeleteModal,
    closeDeleteModal,
    closeAllModals,
  };
}
