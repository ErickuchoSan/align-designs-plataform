'use client';

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { PageLoader } from '@/components/ui/Loader';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';

// Hooks
import { useProjectFiles } from './hooks/useProjectFiles';
import { useFileOperations } from './hooks/useFileOperations';
import { useFileModals } from './hooks/useFileModals';
import type { FileData } from './hooks/useProjectFiles';

// Components
import ProjectInfo from './components/ProjectInfo';
import ProjectWorkflowSection from './components/ProjectWorkflowSection';
import AlertMessages from './components/AlertMessages';
import FileModalsGroup from './components/FileModalsGroup';
import TimeTrackingCharts from '@/components/dashboard/TimeTrackingCharts';
import ProjectStagesView from '@/components/projects/ProjectStagesView';
import PaymentModalsGroup from './components/PaymentModalsGroup';
import { usePaymentModals } from './hooks/usePaymentModals';

/**
 * Project Details Page - Refactored for better maintainability
 *
 * Responsibilities:
 * - Coordinate data fetching and state management
 * - Orchestrate user interactions
 * - Delegate rendering to specialized components
 *
 * Reduced from 395 lines to ~200 lines by extracting components
 */
export default function ProjectDetailsPage() {
  const { user, isAuthenticated, isAdmin, loading } = useProtectedRoute();
  const router = useRouter();
  const params = useParams();
  const projectId = params?.id as string;

  /**
   * Effect 1: Validate projectId
   * Simple validation - redirects if no projectId after loading completes
   */
  useEffect(() => {
    if (!loading && !projectId) {
      router.push('/dashboard');
    }
  }, [projectId, loading, router]);

  // Project and files state management
  const {
    project,
    files,
    // filteredFiles, // Deprecated: we use files directly now as they are server-filtered
    loading: filesLoading,
    error,
    success,
    // setFilteredFiles,
    setError,
    setSuccess,
    fetchProjectDetails,
    fetchFiles,
    currentPage,
    itemsPerPage,
    refreshTypes,
  } = useProjectFiles(projectId);

  // UI state (modals)
  const modals = useFileModals();
  const paymentModals = usePaymentModals();

  // Stage selection state for upload/comment modals
  const [selectedStageForModal, setSelectedStageForModal] = useState<string | null>(null);

  // File operations handlers
  const {
    uploading,
    uploadProgress,
    deleting,
    handleFileUpload,
    handleCreateComment,
    handleEditEntry,
    handleDownload,
    handleDelete,
  } = useFileOperations(projectId, setSuccess, setError, async () => {
    await fetchFiles();
    await refreshTypes();
  });

  /**
   * Effect 2: Fetch data when authenticated
   * Depends on: projectId, authentication status, pagination params
   * Triggers: API calls to fetch project details and files
   */
  useEffect(() => {
    if (projectId && isAuthenticated) {
      fetchProjectDetails();
      fetchFiles();
    }
  }, [projectId, isAuthenticated, currentPage, itemsPerPage, fetchProjectDetails, fetchFiles]);

  // Unified content submission handler (handles comment only, file only, or both)
  const handleContentSubmit = useCallback(
    async (data: { comment: string; files: File[] }) => {
      const { comment, files: uploadFiles } = data;
      const hasFiles = uploadFiles.length > 0;
      const hasComment = comment.trim().length > 0;

      let success = false;

      if (hasFiles) {
        // Upload files with optional comment
        success = await handleFileUpload(uploadFiles, comment, selectedStageForModal || undefined);
      } else if (hasComment) {
        // Comment only (no files)
        success = await handleCreateComment(comment, [], selectedStageForModal || undefined);
      }

      if (success) {
        modals.closeContentModal();
        setSelectedStageForModal(null);
      }
      return success;
    },
    [handleFileUpload, handleCreateComment, modals, selectedStageForModal]
  );

  // Reject file handler (for admin rejecting submitted work)
  const handleRejectSubmit = useCallback(
    async (comment: string, uploadFiles: File[]) => {
      const relatedFileId = modals.fileToReject?.id;
      const success = await handleCreateComment(comment, uploadFiles, selectedStageForModal || undefined, relatedFileId);

      if (success) {
        modals.closeRejectModal();
        setSelectedStageForModal(null);
      }
      return success;
    },
    [handleCreateComment, modals, selectedStageForModal]
  );

  const handleEdit = useCallback(
    async (fileToEdit: FileData, editComment: string, editFiles: File[]) => {
      const success = await handleEditEntry(fileToEdit, editComment, editFiles);
      if (success) modals.closeEditModal();
      return success;
    },
    [handleEditEntry, modals]
  );

  // Memoized callback for project updates (used by ProjectWorkflowSection)
  const handleProjectUpdate = useCallback(async () => {
    await fetchProjectDetails();
    await fetchFiles();
  }, [fetchProjectDetails, fetchFiles]);

  const handleDeleteConfirm = useCallback(
    async (file: FileData) => {
      const success = await handleDelete(file);
      if (success) modals.closeDeleteModal();
      return success;
    },
    [handleDelete, modals]
  );

  const canDeleteFile = useCallback(
    (file: FileData) => {
      if (isAdmin) return true;
      if (file.uploadedBy === user?.id) return true;
      return false;
    },
    [isAdmin, user]
  );

  // Early returns for loading and error states
  if (!projectId) {
    return <PageLoader text="Invalid project..." />;
  }

  if (loading) {
    return <PageLoader text="Loading project..." />;
  }

  if (!project) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-[#1B1C1A] font-medium">Project not found</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-4 px-4 py-2 bg-gradient-to-br from-[#755B00] to-[#C9A84C] text-white rounded-lg hover:brightness-95 transition-all"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col h-full">
        <DashboardHeader
          title={project.name}
          showBackButton
          backUrl="/dashboard"
        />

        <main id="main-content" className="flex-1 px-6 py-8">
          <div className="max-w-7xl mx-auto">
          <AlertMessages success={success} error={error} />

          <ProjectInfo project={project} />

          {/* Analytics Section (Admin/Employee Only) */}
          {(isAdmin || (user && project.employees?.some(pe => pe.employeeId === user.id))) && (
            <TimeTrackingCharts projectId={projectId} />
          )}

          <ProjectWorkflowSection
            project={project}
            isAdmin={isAdmin}
            userRole={user?.role}
            onUpdate={handleProjectUpdate}
          />

          {/* Stages View - Replaces old file section with stage-based organization */}
          {!(user?.role === 'CLIENT' && project.status === 'WAITING_PAYMENT') && (
            <div className="mt-8">
              <ProjectStagesView
                projectId={projectId}
                projectName={project.name}
                project={project}
                files={files}
                onOpenContentModal={(stage) => {
                  setSelectedStageForModal(stage);
                  modals.openContentModal();
                }}
                onOpenRejectModal={(stage, file) => {
                  setSelectedStageForModal(stage);
                  modals.openRejectModal(file);
                }}
                onDownload={handleDownload}
                onEdit={modals.openEditModal}
                onDelete={modals.openDeleteModal}
                onViewHistory={modals.openHistoryModal}
                onUploadVersion={modals.openUploadVersionModal}
                onGenerateInvoice={paymentModals.openGenerateInvoiceModal}
                onPayEmployee={paymentModals.openPayEmployeeModal}
                onUploadPaymentProof={paymentModals.openUploadPaymentProofModal}
                canDeleteFile={canDeleteFile}
                filesLoading={filesLoading}
                onRefresh={handleProjectUpdate}
              />
            </div>
          )}
          </div>
        </main>
      </div>

      <FileModalsGroup
        showContentModal={modals.showContentModal}
        onCloseContentModal={modals.closeContentModal}
        onSubmitContent={handleContentSubmit}
        uploading={uploading}
        uploadProgress={uploadProgress}
        uploadError={error}
        onClearError={() => setError('')}
        showRejectModal={modals.showRejectModal}
        onCloseRejectModal={modals.closeRejectModal}
        onSubmitReject={handleRejectSubmit}
        showEditModal={modals.showEditModal}
        onCloseEditModal={modals.closeEditModal}
        onEdit={handleEdit}
        fileToEdit={modals.fileToEdit}
        showDeleteModal={modals.showDeleteModal}
        onCloseDeleteModal={modals.closeDeleteModal}
        onDelete={handleDeleteConfirm}
        fileToDelete={modals.fileToDelete}
        deleting={deleting}
        showHistoryModal={modals.showHistoryModal}
        onCloseHistoryModal={modals.closeHistoryModal}
        fileToViewHistory={modals.fileToViewHistory}
        showUploadVersionModal={modals.showUploadVersionModal}
        onCloseUploadVersionModal={modals.closeUploadVersionModal}
        onUploadVersion={async () => {
          await fetchFiles();
          modals.closeUploadVersionModal();
        }}
        fileToVersion={modals.fileToVersion}
        selectedStageName={selectedStageForModal || undefined}
      />

      <PaymentModalsGroup
        projectId={projectId}
        userId={user?.id || ''}
        showGenerateInvoiceModal={paymentModals.showGenerateInvoiceModal}
        onCloseGenerateInvoiceModal={paymentModals.closeGenerateInvoiceModal}
        showPayEmployeeModal={paymentModals.showPayEmployeeModal}
        onClosePayEmployeeModal={paymentModals.closePayEmployeeModal}
        showUploadPaymentProofModal={paymentModals.showUploadPaymentProofModal}
        onCloseUploadPaymentProofModal={paymentModals.closeUploadPaymentProofModal}
        onSuccess={handleProjectUpdate}
      />
    </>
  );
}
