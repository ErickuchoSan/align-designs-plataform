'use client';

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { PageLoader } from '@/app/components/Loader';
import DashboardHeader from '@/app/components/DashboardHeader';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';

// Hooks
import { useProjectFiles } from './hooks/useProjectFiles';
import { useFileOperations } from './hooks/useFileOperations';
import { useFileModals } from './hooks/useFileModals';
import { useFileFilters } from './hooks/useFileFilters';
import type { FileData } from './hooks/useProjectFiles';

// Components
import ProjectInfo from './components/ProjectInfo';
import ProjectWorkflowSection from './components/ProjectWorkflowSection';
import AlertMessages from './components/AlertMessages';
import FileModalsGroup from './components/FileModalsGroup';
import TimeTrackingCharts from '@/components/dashboard/TimeTrackingCharts';
import ProjectStagesView from '@/components/projects/ProjectStagesView';

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
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    totalItems,
    totalPages,
    // Filters (Server-Side)
    nameFilter,
    setNameFilter,
    typeFilter,
    setTypeFilter,
    availableTypes,
    refreshTypes,
  } = useProjectFiles(projectId);

  // UI state (modals)
  const modals = useFileModals();
  // const filters = useFileFilters(files); // Removed client-side filters

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

  // Handle page resets when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [nameFilter, typeFilter, setCurrentPage]);

  // File operation handlers
  const handleUpload = useCallback(
    async (files: File[], comment: string) => {
      const success = await handleFileUpload(files, comment, selectedStageForModal || undefined);
      if (success) {
        modals.closeUploadModal();
        setSelectedStageForModal(null);
      }
      return success;
    },
    [handleFileUpload, modals, selectedStageForModal]
  );

  const handleComment = useCallback(
    async (comment: string, files: File[]) => {
      // Use relatedFile from modals if available (for rejections), or fallback to simple stage selection
      const relatedFileId = modals.relatedFile?.id;
      const success = await handleCreateComment(comment, files, selectedStageForModal || undefined, relatedFileId);

      if (success) {
        modals.closeCommentModal();
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
      if (user && file.uploadedBy === user.id) return true;
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
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-navy-900 font-medium">Project not found</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-4 px-4 py-2 bg-navy-800 text-white rounded-lg hover:bg-navy-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-stone-50">
        <DashboardHeader
          title={project.name}
          showBackButton
          backUrl="/dashboard"
        />

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
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
                onOpenUploadModal={(stage) => {
                  setSelectedStageForModal(stage);
                  modals.openUploadModal();
                }}
                onOpenCommentModal={(stage, file) => {
                  setSelectedStageForModal(stage);
                  modals.openCommentModal(file);
                }}
                onDownload={handleDownload}
                onEdit={modals.openEditModal}
                onDelete={modals.openDeleteModal}
                onViewHistory={modals.openHistoryModal}
                onUploadVersion={modals.openUploadVersionModal}
                canDeleteFile={canDeleteFile}
                filesLoading={filesLoading}
                onRefresh={handleProjectUpdate}
              />
            </div>
          )}
        </main>
      </div>

      <FileModalsGroup
        showUploadModal={modals.showUploadModal}
        onCloseUploadModal={modals.closeUploadModal}
        onUpload={handleUpload}
        uploading={uploading}
        uploadProgress={uploadProgress}
        uploadError={error}
        onClearError={() => setError('')}
        showCommentModal={modals.showCommentModal}
        onCloseCommentModal={modals.closeCommentModal}
        onSubmitComment={handleComment}
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
      />
    </>
  );
}
