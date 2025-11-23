'use client';

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { PageLoader } from '@/app/components/Loader';
import DashboardHeader from '@/app/components/DashboardHeader';
import Pagination from '@/app/components/Pagination';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';

// Hooks
import { useProjectFiles } from './hooks/useProjectFiles';
import { useFileOperations } from './hooks/useFileOperations';
import { useFileModals } from './hooks/useFileModals';
import { useFileFilters } from './hooks/useFileFilters';
import type { FileData } from './hooks/useProjectFiles';

// Components
import ProjectInfo from './components/ProjectInfo';
import FileActionsBar from './components/FileActionsBar';
import AlertMessages from './components/AlertMessages';
import FileList from './components/FileList';
import FileModalsGroup from './components/FileModalsGroup';

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
    filteredFiles,
    loading: filesLoading,
    error,
    success,
    setFilteredFiles,
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
  } = useProjectFiles(projectId);

  // UI state (modals and filters)
  const modals = useFileModals();
  const filters = useFileFilters(files);

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
  } = useFileOperations(projectId, setSuccess, setError, fetchFiles);

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

  // Local pagination for client-side filtered results (future: move to server)
  const [localCurrentPage, setLocalCurrentPage] = useState(1);
  const [localItemsPerPage, setLocalItemsPerPage] = useState(10);

  // Check if client-side filters are active
  const hasActiveFilters = useMemo(
    () => filters.nameFilter || filters.typeFilter !== 'all',
    [filters.nameFilter, filters.typeFilter]
  );

  /**
   * Effect 3: Apply client-side filters
   * Note: This is temporary. Filters should move to backend for better performance.
   * See HIGH #3 implementation in backend for server-side filtering.
   */
  useEffect(() => {
    if (!Array.isArray(files)) {
      setFilteredFiles([]);
      return;
    }
    setFilteredFiles(filters.applyFilters(files));
  }, [files, filters.nameFilter, filters.typeFilter, filters.applyFilters, setFilteredFiles]);

  /**
   * Effect 4: Reset pagination when filters change
   * Ensures user starts at page 1 when applying new filters
   */
  useEffect(() => {
    setLocalCurrentPage(1);
  }, [filters.nameFilter, filters.typeFilter]);

  // File operation handlers
  const handleUpload = useCallback(
    async (file: File, comment: string) => {
      const success = await handleFileUpload(file, comment);
      if (success) modals.closeUploadModal();
      return success;
    },
    [handleFileUpload, modals]
  );

  const handleComment = useCallback(
    async (comment: string) => {
      const success = await handleCreateComment(comment);
      if (success) modals.closeCommentModal();
      return success;
    },
    [handleCreateComment, modals]
  );

  const handleEdit = useCallback(
    async (fileToEdit: FileData, editComment: string, editFile: File | null) => {
      const success = await handleEditEntry(fileToEdit, editComment, editFile);
      if (success) modals.closeEditModal();
      return success;
    },
    [handleEditEntry, modals]
  );

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

  // Calculate pagination values based on whether filters are active - memoized
  const paginationValues = useMemo(
    () => ({
      currentPage: hasActiveFilters ? localCurrentPage : currentPage,
      itemsPerPage: hasActiveFilters ? localItemsPerPage : itemsPerPage,
      totalItems: hasActiveFilters ? filteredFiles.length : totalItems,
      totalPages: hasActiveFilters
        ? Math.ceil(filteredFiles.length / localItemsPerPage)
        : totalPages,
    }),
    [
      hasActiveFilters,
      localCurrentPage,
      currentPage,
      localItemsPerPage,
      itemsPerPage,
      filteredFiles.length,
      totalItems,
      totalPages,
    ]
  );

  // Apply local pagination to filtered files if filters are active - memoized
  const displayedFiles = useMemo(() => {
    if (!hasActiveFilters) return filteredFiles;

    return filteredFiles.slice(
      (localCurrentPage - 1) * localItemsPerPage,
      localCurrentPage * localItemsPerPage
    );
  }, [hasActiveFilters, filteredFiles, localCurrentPage, localItemsPerPage]);

  const handlePageChange = (page: number) => {
    if (hasActiveFilters) {
      setLocalCurrentPage(page);
    } else {
      setCurrentPage(page);
    }
  };

  const handleItemsPerPageChange = (limit: number) => {
    if (hasActiveFilters) {
      setLocalItemsPerPage(limit);
      setLocalCurrentPage(1);
    } else {
      setItemsPerPage(limit);
    }
  };

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

          <FileActionsBar
            nameFilter={filters.nameFilter}
            setNameFilter={filters.setNameFilter}
            typeFilter={filters.typeFilter}
            setTypeFilter={filters.setTypeFilter}
            availableTypes={filters.availableTypes}
            onOpenCommentModal={modals.openCommentModal}
            onOpenUploadModal={modals.openUploadModal}
          />

          <FileList
            files={displayedFiles}
            onDownload={handleDownload}
            onEdit={modals.openEditModal}
            onDelete={modals.openDeleteModal}
            canDelete={canDeleteFile}
          />

          {paginationValues.totalPages > 0 && (
            <Pagination
              currentPage={paginationValues.currentPage}
              totalPages={paginationValues.totalPages}
              totalItems={paginationValues.totalItems}
              itemsPerPage={paginationValues.itemsPerPage}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
            />
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
      />
    </>
  );
}
