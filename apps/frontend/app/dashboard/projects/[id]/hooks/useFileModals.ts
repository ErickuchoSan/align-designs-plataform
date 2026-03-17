import { useCallback } from 'react';
import { useModal, useModalWithData } from '@/hooks/useModal';
import type { FileData } from './useProjectFiles';

export interface FileModalsState {
  showUploadModal: boolean;
  showCommentModal: boolean;
  showEditModal: boolean;
  showDeleteModal: boolean;
  showHistoryModal: boolean;
  showUploadVersionModal: boolean;
  relatedFile: FileData | null; // Context for the comment (e.g. file being rejected)
  fileToEdit: FileData | null;
  fileToDelete: FileData | null;
  fileToViewHistory: FileData | null;
  fileToVersion: FileData | null;
}

export interface FileModalsActions {
  openUploadModal: () => void;
  closeUploadModal: () => void;
  openCommentModal: (file?: FileData) => void;
  closeCommentModal: () => void;
  openEditModal: (file: FileData) => void;
  closeEditModal: () => void;
  openDeleteModal: (file: FileData) => void;
  closeDeleteModal: () => void;
  openHistoryModal: (file: FileData) => void;
  closeHistoryModal: () => void;
  openUploadVersionModal: (file: FileData) => void;
  closeUploadVersionModal: () => void;
  closeAllModals: () => void;
}

export interface UseFileModalsReturn extends FileModalsState, FileModalsActions { }

export function useFileModals(): UseFileModalsReturn {
  // Use generic modal hooks to reduce boilerplate
  const uploadModal = useModal();
  const commentModal = useModalWithData<FileData>(); // Now supports data
  const editModal = useModalWithData<FileData>();
  const deleteModal = useModalWithData<FileData>();
  const historyModal = useModalWithData<FileData>();
  const uploadVersionModal = useModalWithData<FileData>();

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
    showHistoryModal: historyModal.isOpen,
    showUploadVersionModal: uploadVersionModal.isOpen,
    relatedFile: commentModal.data,
    fileToEdit: editModal.data,
    fileToDelete: deleteModal.data,
    fileToViewHistory: historyModal.data,
    fileToVersion: uploadVersionModal.data,
    // Actions
    openUploadModal: uploadModal.open,
    closeUploadModal: uploadModal.close,
    openCommentModal: commentModal.open,
    closeCommentModal: commentModal.close,
    openEditModal: editModal.open,
    closeEditModal: editModal.close,
    openDeleteModal: deleteModal.open,
    closeDeleteModal: deleteModal.close,
    openHistoryModal: historyModal.open,
    closeHistoryModal: historyModal.close,
    openUploadVersionModal: uploadVersionModal.open,
    closeUploadVersionModal: uploadVersionModal.close,
    closeAllModals,
  };
}
