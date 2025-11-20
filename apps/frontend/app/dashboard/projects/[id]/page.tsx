'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { PageLoader } from '@/app/components/Loader';
import DashboardHeader from '@/app/components/DashboardHeader';
import Pagination from '@/app/components/Pagination';
import { formatDate } from '@/lib/utils/date.utils';
import { getFileExtension } from '@/lib/utils/file.utils';
import { api } from '@/lib/api';

// Hooks
import { useProjectFiles } from './hooks/useProjectFiles';
import { useFileOperations } from './hooks/useFileOperations';
import type { FileData } from './hooks/useProjectFiles';

// Components
import FileFilters from './components/FileFilters';
import FileUploadModal from './components/FileUploadModal';
import FileEditModal from './components/FileEditModal';
import FileDeleteModal from './components/FileDeleteModal';
import FileList from './components/FileList';
import CommentModal from './components/CommentModal';

export default function ProjectDetailsPage() {
  const { user, isAuthenticated, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const projectId = params?.id as string;

  // Project and files state
  const {
    project,
    files,
    filteredFiles,
    loading,
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

  // Filters
  const [nameFilter, setNameFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [availableTypes, setAvailableTypes] = useState<string[]>([]);

  // Modal states
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [fileToEdit, setFileToEdit] = useState<FileData | null>(null);
  const [fileToDelete, setFileToDelete] = useState<FileData | null>(null);

  // File operations
  const {
    uploading,
    uploadProgress,
    deleting,
    handleFileUpload,
    handleCreateComment,
    handleEditEntry,
    handleDownload,
    handleDelete,
  } = useFileOperations(
    projectId,
    setSuccess,
    setError,
    fetchFiles
  );

  // Authentication check
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  // Fetch project and files
  useEffect(() => {
    if (projectId && isAuthenticated) {
      fetchProjectDetails();
      fetchFiles();
    }
  }, [projectId, isAuthenticated, currentPage, itemsPerPage, fetchProjectDetails, fetchFiles]);

  // Extract available file types
  useEffect(() => {
    if (!Array.isArray(files)) return;

    const types = Array.from(
      new Set(
        files
          .filter(file => file.originalName)
          .map(file => getFileExtension(file.originalName!))
      )
    );
    setAvailableTypes(types);
  }, [files]);

  // Local pagination state for filtered results
  const [localCurrentPage, setLocalCurrentPage] = useState(1);
  const [localItemsPerPage, setLocalItemsPerPage] = useState(10);

  // Check if filters are active - memoized to prevent recalculation
  const hasActiveFilters = useMemo(
    () => nameFilter || typeFilter !== 'all',
    [nameFilter, typeFilter]
  );

  // Apply filters and local pagination
  useEffect(() => {
    if (!Array.isArray(files)) {
      setFilteredFiles([]);
      return;
    }

    let filtered = files;

    if (nameFilter) {
      filtered = filtered.filter(file => {
        if (!file.originalName) return false;
        return file.originalName.toLowerCase().includes(nameFilter.toLowerCase());
      });
    }

    if (typeFilter === 'comments') {
      // Filter only comment-only entries (no file attached)
      filtered = filtered.filter(file => !file.filename);
    } else if (typeFilter !== 'all') {
      // Filter by file type
      filtered = filtered.filter(file =>
        file.originalName && getFileExtension(file.originalName) === typeFilter
      );
    }

    setFilteredFiles(filtered);
  }, [files, nameFilter, typeFilter, setFilteredFiles]);

  // Reset local pagination when filters change
  useEffect(() => {
    setLocalCurrentPage(1);
  }, [nameFilter, typeFilter]);

  // File operation handlers
  const handleUpload = useCallback(
    async (file: File, comment: string) => {
      const success = await handleFileUpload(file, comment);
      if (success) {
        setShowUploadModal(false);
      }
      return success;
    },
    [handleFileUpload]
  );

  const handleComment = useCallback(
    async (comment: string) => {
      const success = await handleCreateComment(comment);
      if (success) {
        setShowCommentModal(false);
      }
      return success;
    },
    [handleCreateComment]
  );

  const handleEdit = useCallback(
    async (fileToEdit: FileData, editComment: string, editFile: File | null) => {
      const success = await handleEditEntry(fileToEdit, editComment, editFile);
      if (success) {
        setShowEditModal(false);
        setFileToEdit(null);
      }
      return success;
    },
    [handleEditEntry]
  );

  const handleDeleteConfirm = useCallback(
    async (file: FileData) => {
      const success = await handleDelete(file);
      if (success) {
        setShowDeleteModal(false);
        setFileToDelete(null);
      }
      return success;
    },
    [handleDelete]
  );

  const openEditModal = useCallback((file: FileData) => {
    setFileToEdit(file);
    setShowEditModal(true);
  }, []);

  const openDeleteConfirm = useCallback((file: FileData) => {
    setFileToDelete(file);
    setShowDeleteModal(true);
  }, []);

  const canDeleteFile = useCallback(
    (file: FileData) => {
      if (isAdmin) return true;
      if (user && file.uploadedBy === user.id) return true;
      return false;
    },
    [isAdmin, user]
  );

  // Calculate pagination values based on whether filters are active - memoized
  const paginationValues = useMemo(() => ({
    currentPage: hasActiveFilters ? localCurrentPage : currentPage,
    itemsPerPage: hasActiveFilters ? localItemsPerPage : itemsPerPage,
    totalItems: hasActiveFilters ? filteredFiles.length : totalItems,
    totalPages: hasActiveFilters
      ? Math.ceil(filteredFiles.length / localItemsPerPage)
      : totalPages,
  }), [hasActiveFilters, localCurrentPage, currentPage, localItemsPerPage, itemsPerPage, filteredFiles.length, totalItems, totalPages]);

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

  if (authLoading || loading) {
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

        {/* Main content */}
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Success/Error messages */}
          {success && (
            <div className="mb-6 rounded-lg bg-forest-50 border border-forest-200 p-4 animate-slideDown">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-forest-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-sm font-medium text-forest-800">{success}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 animate-slideDown">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* Project Info */}
          <div className="bg-white rounded-2xl shadow-lg border border-stone-200 p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-navy-600 to-navy-800 rounded-full flex items-center justify-center text-gold-400 font-bold">
                {project.client.firstName[0]}{project.client.lastName[0]}
              </div>
              <div>
                <p className="font-semibold text-navy-900">
                  {project.client.firstName} {project.client.lastName}
                </p>
                <p className="text-sm text-stone-700">{project.client.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-stone-700">
              {project._count && (
                <>
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    {project._count.files} file{project._count.files !== 1 ? 's' : ''}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    {project._count.comments} comment{project._count.comments !== 1 ? 's' : ''}
                  </span>
                </>
              )}
              <span>
                Created: {formatDate(project.createdAt, 'LONG')}
              </span>
            </div>
          </div>

          {/* Filters and Upload button */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <FileFilters
              nameFilter={nameFilter}
              setNameFilter={setNameFilter}
              typeFilter={typeFilter}
              setTypeFilter={setTypeFilter}
              availableTypes={availableTypes}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowCommentModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-gold-600 text-white rounded-lg hover:bg-gold-700 shadow-lg hover:shadow-xl transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
                Create Comment
              </button>
              <button
                onClick={() => setShowUploadModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-navy-800 text-white rounded-lg hover:bg-navy-700 shadow-lg hover:shadow-xl transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Upload File
              </button>
            </div>
          </div>

          {/* Files Table */}
          <FileList
            files={displayedFiles}
            onDownload={handleDownload}
            onEdit={openEditModal}
            onDelete={openDeleteConfirm}
            canDelete={canDeleteFile}
          />

          {/* Pagination */}
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

      {/* Modals */}
      <FileUploadModal
        show={showUploadModal}
        onClose={() => {
          setShowUploadModal(false);
          setError('');
        }}
        onUpload={handleUpload}
        uploading={uploading}
        uploadProgress={uploadProgress}
        error={error}
      />

      <CommentModal
        show={showCommentModal}
        onClose={() => setShowCommentModal(false)}
        onSubmit={handleComment}
        uploading={uploading}
      />

      <FileEditModal
        show={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setFileToEdit(null);
        }}
        onEdit={handleEdit}
        file={fileToEdit}
        uploading={uploading}
      />

      <FileDeleteModal
        show={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setFileToDelete(null);
        }}
        onDelete={handleDeleteConfirm}
        file={fileToDelete}
        deleting={deleting}
      />
    </>
  );
}
