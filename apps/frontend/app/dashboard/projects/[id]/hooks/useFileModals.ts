import { useCallback } from 'react';
import { useModal, useModalWithData } from '@/hooks/useModal';
import type { FileData } from './useProjectFiles';

export interface FileModalsState {
  showContentModal: boolean;
  showRejectModal: boolean;
  showEditModal: boolean;
  showDeleteModal: boolean;
  showHistoryModal: boolean;
  showUploadVersionModal: boolean;
  fileToReject: FileData | null;
  fileToEdit: FileData | null;
  fileToDelete: FileData | null;
  fileToViewHistory: FileData | null;
  fileToVersion: FileData | null;
}

export interface FileModalsActions {
  openContentModal: () => void;
  closeContentModal: () => void;
  openRejectModal: (file: FileData) => void;
  closeRejectModal: () => void;
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
  const contentModal = useModal();
  const rejectModal = useModalWithData<FileData>();
  const editModal = useModalWithData<FileData>();
  const deleteModal = useModalWithData<FileData>();
  const historyModal = useModalWithData<FileData>();
  const uploadVersionModal = useModalWithData<FileData>();

  // Close all modals utility
  const closeAllModals = useCallback(() => {
    contentModal.close();
    rejectModal.close();
    editModal.close();
    deleteModal.close();
  }, [contentModal, rejectModal, editModal, deleteModal]);

  return {
    // State
    showContentModal: contentModal.isOpen,
    showRejectModal: rejectModal.isOpen,
    showEditModal: editModal.isOpen,
    showDeleteModal: deleteModal.isOpen,
    showHistoryModal: historyModal.isOpen,
    showUploadVersionModal: uploadVersionModal.isOpen,
    fileToReject: rejectModal.data,
    fileToEdit: editModal.data,
    fileToDelete: deleteModal.data,
    fileToViewHistory: historyModal.data,
    fileToVersion: uploadVersionModal.data,
    // Actions
    openContentModal: contentModal.open,
    closeContentModal: contentModal.close,
    openRejectModal: rejectModal.open,
    closeRejectModal: rejectModal.close,
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
