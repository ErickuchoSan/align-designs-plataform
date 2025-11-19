'use client';
import { MESSAGE_DURATION, FILE_UPLOAD } from '@/lib/constants/ui.constants';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Modal from '@/app/components/Modal';
import { ButtonLoader, PageLoader } from '@/app/components/Loader';
import FileInput from '@/app/components/FileInput';
import DashboardHeader from '@/app/components/DashboardHeader';
import { formatDate } from '@/lib/utils/date.utils';
import { sanitizeText } from '@/lib/utils/text.utils';

interface FileData {
  id: string;
  filename: string | null;
  originalName: string | null;
  sizeBytes: number | null;
  mimeType: string | null;
  uploadedBy: string;
  comment?: string | null;
  uploader: {
    firstName: string;
    lastName: string;
    email: string;
  };
  uploadedAt: string;
}

interface ProjectData {
  id: string;
  name: string;
  description: string | null;
  clientId: string;
  client: {
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
  _count: {
    files: number;
  };
}

export default function ProjectDetailsPage() {
  const { user, isAuthenticated, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const projectId = params?.id as string;

  const [project, setProject] = useState<ProjectData | null>(null);
  const [files, setFiles] = useState<FileData[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<FileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filters
  const [nameFilter, setNameFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [availableTypes, setAvailableTypes] = useState<string[]>([]);

  // Upload modal
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadComment, setUploadComment] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Comment-only modal
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [commentText, setCommentText] = useState('');

  // Edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [fileToEdit, setFileToEdit] = useState<FileData | null>(null);
  const [editComment, setEditComment] = useState('');
  const [editFile, setEditFile] = useState<File | null>(null);

  // Delete confirmation
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<FileData | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (projectId && isAuthenticated) {
      fetchProjectDetails();
      fetchFiles();
    }
  }, [projectId, isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // Extract unique file types (only from files that have an actual file, not comment-only)
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

  useEffect(() => {
    // Apply filters
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
  }, [files, nameFilter, typeFilter]);

  const fetchProjectDetails = async () => {
    try {
      const { data } = await api.get(`/projects/${projectId}`);
      setProject(data);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Error loading project');
    }
  };

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/files/project/${projectId}`);
      // Backend returns paginated response: { data: [...], meta: {...} }
      // Extract the data array from the paginated response
      const filesArray = data?.data || data;
      setFiles(Array.isArray(filesArray) ? filesArray : []);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Error loading files');
      setFiles([]); // Reset to empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || uploading) return; // Prevent duplicate submissions

    // Validate file size before upload
    if (selectedFile.size > FILE_UPLOAD.MAX_SIZE_BYTES) {
      const fileSizeGB = (selectedFile.size / 1024 / 1024 / 1024).toFixed(2);
      const maxSizeGB = (FILE_UPLOAD.MAX_SIZE_MB / 1000).toFixed(0);
      setError(`File size (${fileSizeGB}GB) exceeds maximum allowed size of ${maxSizeGB}GB.`);
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      if (uploadComment) {
        formData.append('comment', uploadComment);
      }

      await api.post(`/files/${projectId}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = progressEvent.total
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : 0;
          setUploadProgress(percentCompleted);
        },
      });

      setSuccess('File uploaded successfully');
      setShowUploadModal(false);
      setSelectedFile(null);
      setUploadComment('');
      setUploadProgress(0);
      await fetchFiles();

      setTimeout(() => setSuccess(''), MESSAGE_DURATION.SUCCESS);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      // Keep error in modal context, don't set global error
      setError(error.response?.data?.message || 'Error uploading file');
      // Don't close modal on error so user can see the message
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleCreateComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setUploading(true);
    setError('');

    try {
      await api.post(`/files/${projectId}/comment`, {
        comment: commentText,
      });

      setSuccess('Comment created successfully');
      setShowCommentModal(false);
      setCommentText('');
      await fetchFiles();

      setTimeout(() => setSuccess(''), MESSAGE_DURATION.SUCCESS);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Error creating comment');
    } finally {
      setUploading(false);
    }
  };

  const openEditModal = (file: FileData) => {
    setFileToEdit(file);
    setEditComment(file.comment || '');
    setEditFile(null);
    setShowEditModal(true);
  };

  const handleEditEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileToEdit) return;

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();

      // Add comment if changed
      if (editComment !== fileToEdit.comment) {
        formData.append('comment', editComment);
      }

      // Add file if user selected one
      if (editFile) {
        formData.append('file', editFile);
      }

      await api.patch(`/files/${fileToEdit.id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccess('Entry updated successfully');
      setShowEditModal(false);
      setFileToEdit(null);
      setEditComment('');
      setEditFile(null);
      await fetchFiles();

      setTimeout(() => setSuccess(''), MESSAGE_DURATION.SUCCESS);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Error updating entry');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (fileId: string, fileName: string) => {
    try {
      const response = await api.get(`/files/${fileId}/download`, {
        responseType: 'blob',
      });

      // Validate MIME type from response headers
      const contentType = response.headers['content-type'];

      // List of allowed MIME types for download
      const allowedMimeTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'text/csv',
        'application/zip',
        'application/x-zip-compressed',
      ];

      // Validate content type
      if (!contentType || !allowedMimeTypes.some(type => contentType.includes(type))) {
        setError(`Invalid file type received: ${contentType || 'unknown'}. Download blocked for security.`);
        return;
      }

      const url = window.URL.createObjectURL(new Blob([response.data], { type: contentType }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setSuccess('File downloaded successfully');
      setTimeout(() => setSuccess(''), MESSAGE_DURATION.SUCCESS);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Error downloading file');
    }
  };

  const openDeleteConfirm = (file: FileData) => {
    setFileToDelete(file);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!fileToDelete) return;

    setDeleting(true);
    setError('');

    try {
      await api.delete(`/files/${fileToDelete.id}`);
      setSuccess('File deleted successfully');
      setShowDeleteModal(false);
      setFileToDelete(null);
      await fetchFiles();

      setTimeout(() => setSuccess(''), MESSAGE_DURATION.SUCCESS);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Error deleting file');
    } finally {
      setDeleting(false);
    }
  };

  const getFileExtension = (fileName: string | null) => {
    if (!fileName) return '';
    const ext = fileName.split('.').pop()?.toLowerCase();
    return ext ? `.${ext}` : '';
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const canDeleteFile = (file: FileData) => {
    if (isAdmin) return true;
    if (user && file.uploadedBy === user.id) return true;
    return false;
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
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                {files.length} file{files.length !== 1 ? 's' : ''}
              </span>
              <span>
                Created: {formatDate(project.createdAt, 'LONG')}
              </span>
            </div>
          </div>

          {/* Filters and Upload button */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Search by name..."
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
                className="px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent text-navy-900 placeholder:text-stone-700"
              />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent text-navy-900"
              >
                <option value="all">All types</option>
                <option value="comments">Comments only</option>
                {availableTypes.map(type => (
                  <option key={type} value={type}>{type.toUpperCase()}</option>
                ))}
              </select>
            </div>
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
          {filteredFiles.length === 0 ? (
            <div className="rounded-2xl bg-white p-12 text-center shadow-lg border border-stone-200">
              <div className="mx-auto w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-stone-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-lg text-navy-900 font-medium">No files in this project</p>
              <p className="text-sm text-stone-700 mt-2">Upload your first file to get started</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-lg border border-stone-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-stone-200">
                  <thead className="bg-stone-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-navy-900 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-navy-900 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-navy-900 uppercase tracking-wider">
                        Size
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-navy-900 uppercase tracking-wider">
                        Comment
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-navy-900 uppercase tracking-wider">
                        Uploaded by
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-navy-900 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-navy-900 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-stone-200">
                    {filteredFiles.map((file) => (
                      <tr key={file.id} className="hover:bg-stone-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {file.filename ? (
                              <>
                                <svg className="w-5 h-5 text-navy-700 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                                <div className="text-sm font-medium text-navy-900">{file.originalName}</div>
                              </>
                            ) : (
                              <>
                                <svg className="w-5 h-5 text-gold-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                </svg>
                                <div className="text-sm font-medium text-stone-700 italic">No file</div>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {file.filename ? (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gold-100 text-gold-800">
                              {getFileExtension(file.originalName).toUpperCase().replace('.', '')}
                            </span>
                          ) : (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-stone-200 text-stone-700">
                              COMMENT
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-700">
                          {file.sizeBytes ? formatFileSize(file.sizeBytes) : '-'}
                        </td>
                        <td className="px-6 py-4 max-w-xs">
                          {file.comment ? (
                            <div className="text-sm text-stone-700 truncate" title={sanitizeText(file.comment)}>
                              {sanitizeText(file.comment)}
                            </div>
                          ) : (
                            <span className="text-sm text-stone-700 italic">No comment</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-navy-900">{file.uploader.firstName} {file.uploader.lastName}</div>
                          <div className="text-xs text-stone-700">{file.uploader.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-700">
                          {formatDate(file.uploadedAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            {file.filename && (
                              <button
                                onClick={() => handleDownload(file.id, file.originalName!)}
                                className="p-2 text-navy-700 hover:bg-navy-50 rounded-lg transition-colors"
                                title="Download"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                              </button>
                            )}
                            {canDeleteFile(file) && (
                              <>
                                <button
                                  onClick={() => openEditModal(file)}
                                  className="p-2 text-gold-600 hover:bg-gold-50 rounded-lg transition-colors"
                                  title="Edit"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => openDeleteConfirm(file)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Delete"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Upload Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => {
          setShowUploadModal(false);
          setSelectedFile(null);
          setUploadComment('');
          setError(''); // Clear error when closing modal
        }}
        title="Upload File"
        size="md"
      >
        <form onSubmit={handleFileUpload} className="space-y-4">
          {/* Error message in modal */}
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-navy-900 mb-2">
              Select file
            </label>
            <FileInput
              onChange={(file) => setSelectedFile(file)}
              required
            />
            {selectedFile && (
              <p className="mt-2 text-sm text-stone-700">
                Selected file: {selectedFile.name} ({formatFileSize(selectedFile.size)})
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-navy-900 mb-2">
              Comment (optional)
            </label>
            <textarea
              value={uploadComment}
              onChange={(e) => setUploadComment(e.target.value)}
              placeholder="Add a comment about this file..."
              rows={3}
              className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent resize-none text-navy-900 placeholder:text-stone-700"
            />
          </div>

          {/* Upload Progress Bar */}
          {uploading && uploadProgress > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-navy-900">
                <span>Uploading...</span>
                <span className="font-medium">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-stone-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-navy-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={() => {
                setShowUploadModal(false);
                setSelectedFile(null);
                setUploadComment('');
                setError(''); // Clear error when canceling
              }}
              disabled={uploading}
              className="px-5 py-2.5 text-sm font-medium text-navy-900 bg-stone-200 rounded-lg hover:bg-stone-300 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading || !selectedFile}
              className="px-5 py-2.5 text-sm font-medium text-white bg-navy-800 rounded-lg hover:bg-navy-700 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px] flex items-center justify-center"
            >
              {uploading ? <ButtonLoader /> : 'Upload File'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Comment-Only Modal */}
      <Modal
        isOpen={showCommentModal}
        onClose={() => {
          setShowCommentModal(false);
          setCommentText('');
        }}
        title="Create Comment"
        size="md"
      >
        <form onSubmit={handleCreateComment} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-navy-900 mb-2">
              Comment
            </label>
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write your comment..."
              rows={4}
              className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent resize-none text-navy-900 placeholder:text-stone-700"
              required
            />
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={() => {
                setShowCommentModal(false);
                setCommentText('');
              }}
              disabled={uploading}
              className="px-5 py-2.5 text-sm font-medium text-navy-900 bg-stone-200 rounded-lg hover:bg-stone-300 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading || !commentText.trim()}
              className="px-5 py-2.5 text-sm font-medium text-white bg-gold-600 rounded-lg hover:bg-gold-700 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px] flex items-center justify-center"
            >
              {uploading ? <ButtonLoader /> : 'Create Comment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setFileToEdit(null);
          setEditComment('');
          setEditFile(null);
        }}
        title="Edit Entry"
        size="md"
      >
        <form onSubmit={handleEditEntry} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-navy-900 mb-2">
              Comment
            </label>
            <textarea
              value={editComment}
              onChange={(e) => setEditComment(e.target.value)}
              placeholder="Write a comment..."
              rows={3}
              className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent resize-none text-navy-900 placeholder:text-stone-700"
            />
            <p className="mt-1 text-xs text-stone-700">
              Leave empty to remove the comment
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-navy-900 mb-2">
              {fileToEdit?.filename ? 'Replace file (optional)' : 'Add file (optional)'}
            </label>
            {fileToEdit?.filename && (
              <p className="mb-2 text-sm text-stone-700">
                Current file: <span className="font-semibold">{fileToEdit.originalName}</span>
              </p>
            )}
            <FileInput
              onChange={(file) => setEditFile(file)}
              placeholder="No file selected"
            />
            {editFile && (
              <p className="mt-2 text-sm text-emerald-700 font-medium">
                New file: {editFile.name} ({formatFileSize(editFile.size)})
              </p>
            )}
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={() => {
                setShowEditModal(false);
                setFileToEdit(null);
                setEditComment('');
                setEditFile(null);
              }}
              disabled={uploading}
              className="px-5 py-2.5 text-sm font-medium text-navy-900 bg-stone-200 rounded-lg hover:bg-stone-300 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="px-5 py-2.5 text-sm font-medium text-white bg-navy-800 rounded-lg hover:bg-navy-700 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px] flex items-center justify-center"
            >
              {uploading ? <ButtonLoader /> : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setFileToDelete(null);
        }}
        title={fileToDelete?.filename ? "Delete File" : "Delete Comment"}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-stone-700">
            {fileToDelete?.filename ? (
              <>
                Are you sure you want to delete the file <strong>{fileToDelete?.originalName}</strong>?
                This action cannot be undone.
              </>
            ) : (
              <>
                Are you sure you want to delete this comment?
                This action cannot be undone.
              </>
            )}
          </p>

          <div className="flex gap-3 justify-end pt-4">
            <button
              onClick={() => {
                setShowDeleteModal(false);
                setFileToDelete(null);
              }}
              disabled={deleting}
              className="px-5 py-2.5 text-sm font-medium text-navy-900 bg-stone-200 rounded-lg hover:bg-stone-300 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-5 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed min-w-[100px] flex items-center justify-center"
            >
              {deleting ? <ButtonLoader /> : 'Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
