import { useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { MESSAGE_DURATION, FILE_UPLOAD } from '@/lib/constants/ui.constants';
import type { FileData } from './useProjectFiles';

export function useFileOperations(
  projectId: string,
  onSuccess: (message: string) => void,
  onError: (message: string) => void,
  onRefresh: () => Promise<void>
) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [deleting, setDeleting] = useState(false);

  const handleFileUpload = useCallback(
    async (file: File, comment: string) => {
      // Validate file size before upload
      if (file.size > FILE_UPLOAD.MAX_SIZE_BYTES) {
        const fileSizeGB = (file.size / 1024 / 1024 / 1024).toFixed(2);
        const maxSizeGB = (FILE_UPLOAD.MAX_SIZE_MB / 1000).toFixed(0);
        onError(`File size (${fileSizeGB}GB) exceeds maximum allowed size of ${maxSizeGB}GB.`);
        return false;
      }

      setUploading(true);
      setUploadProgress(0);

      try {
        const formData = new FormData();
        formData.append('file', file);
        if (comment) {
          formData.append('comment', comment);
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

        onSuccess('File uploaded successfully');
        await onRefresh();

        setTimeout(() => onSuccess(''), MESSAGE_DURATION.SUCCESS);
        return true;
      } catch (error) {
        onError(getErrorMessage(error, 'Error uploading file'));
        return false;
      } finally {
        setUploading(false);
        setUploadProgress(0);
      }
    },
    [projectId, onSuccess, onError, onRefresh]
  );

  const handleCreateComment = useCallback(
    async (comment: string) => {
      if (!comment.trim()) return false;

      setUploading(true);

      try {
        await api.post(`/files/${projectId}/comment`, {
          comment: comment,
        });

        onSuccess('Comment created successfully');
        await onRefresh();

        setTimeout(() => onSuccess(''), MESSAGE_DURATION.SUCCESS);
        return true;
      } catch (error) {
        onError(getErrorMessage(error, 'Error creating comment'));
        return false;
      } finally {
        setUploading(false);
      }
    },
    [projectId, onSuccess, onError, onRefresh]
  );

  const handleEditEntry = useCallback(
    async (fileToEdit: FileData, editComment: string, editFile: File | null) => {
      setUploading(true);

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

        onSuccess('Entry updated successfully');
        await onRefresh();

        setTimeout(() => onSuccess(''), MESSAGE_DURATION.SUCCESS);
        return true;
      } catch (error) {
        onError(getErrorMessage(error, 'Error updating entry'));
        return false;
      } finally {
        setUploading(false);
      }
    },
    [onSuccess, onError, onRefresh]
  );

  const handleDownload = useCallback(
    async (fileId: string, fileName: string) => {
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
          onError(`Invalid file type received: ${contentType || 'unknown'}. Download blocked for security.`);
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

        onSuccess('File downloaded successfully');
        setTimeout(() => onSuccess(''), MESSAGE_DURATION.SUCCESS);
      } catch (error) {
        onError(getErrorMessage(error, 'Error downloading file'));
      }
    },
    [onSuccess, onError]
  );

  const handleDelete = useCallback(
    async (fileToDelete: FileData) => {
      setDeleting(true);

      try {
        await api.delete(`/files/${fileToDelete.id}`);
        onSuccess('File deleted successfully');
        await onRefresh();

        setTimeout(() => onSuccess(''), MESSAGE_DURATION.SUCCESS);
        return true;
      } catch (error) {
        onError(getErrorMessage(error, 'Error deleting file'));
        return false;
      } finally {
        setDeleting(false);
      }
    },
    [onSuccess, onError, onRefresh]
  );

  return {
    uploading,
    uploadProgress,
    deleting,
    handleFileUpload,
    handleCreateComment,
    handleEditEntry,
    handleDownload,
    handleDelete,
  };
}
