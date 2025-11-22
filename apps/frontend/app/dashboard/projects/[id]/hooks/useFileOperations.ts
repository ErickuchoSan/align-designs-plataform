import { useState, useCallback, useRef, useEffect } from 'react';
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

  // Refs to track active timeouts for cleanup
  const timeoutRefs = useRef<NodeJS.Timeout[]>([]);

  // Store latest callbacks in refs to avoid recreating handlers
  // This prevents infinite loops when parent doesn't memoize callbacks
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  const onRefreshRef = useRef(onRefresh);

  // Update callback refs when they change
  useEffect(() => {
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
    onRefreshRef.current = onRefresh;
  }, [onSuccess, onError, onRefresh]);

  // Cleanup all active timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
      timeoutRefs.current = [];
    };
  }, []);

  // Helper to set timeout with automatic tracking for cleanup
  const setTrackedTimeout = useCallback((callback: () => void, delay: number) => {
    const timeoutId = setTimeout(() => {
      callback();
      // Remove from tracking array after execution
      timeoutRefs.current = timeoutRefs.current.filter(id => id !== timeoutId);
    }, delay);
    timeoutRefs.current.push(timeoutId);
    return timeoutId;
  }, []);

  const handleFileUpload = useCallback(
    async (file: File, comment: string) => {
      // Validate file size before upload
      if (file.size > FILE_UPLOAD.MAX_SIZE_BYTES) {
        const fileSizeGB = (file.size / 1024 / 1024 / 1024).toFixed(2);
        const maxSizeGB = (FILE_UPLOAD.MAX_SIZE_MB / 1000).toFixed(0);
        onErrorRef.current(`File size (${fileSizeGB}GB) exceeds maximum allowed size of ${maxSizeGB}GB.`);
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

        onSuccessRef.current('File uploaded successfully');
        await onRefreshRef.current();

        setTrackedTimeout(() => onSuccessRef.current(''), MESSAGE_DURATION.SUCCESS);
        return true;
      } catch (error) {
        onErrorRef.current(getErrorMessage(error, 'Error uploading file'));
        return false;
      } finally {
        setUploading(false);
        setUploadProgress(0);
      }
    },
    [projectId, setTrackedTimeout]
  );

  const handleCreateComment = useCallback(
    async (comment: string) => {
      if (!comment.trim()) return false;

      setUploading(true);

      try {
        await api.post(`/files/${projectId}/comment`, {
          comment: comment,
        });

        onSuccessRef.current('Comment created successfully');
        await onRefreshRef.current();

        setTrackedTimeout(() => onSuccessRef.current(''), MESSAGE_DURATION.SUCCESS);
        return true;
      } catch (error) {
        onErrorRef.current(getErrorMessage(error, 'Error creating comment'));
        return false;
      } finally {
        setUploading(false);
      }
    },
    [projectId, setTrackedTimeout]
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

        onSuccessRef.current('Entry updated successfully');
        await onRefreshRef.current();

        setTrackedTimeout(() => onSuccessRef.current(''), MESSAGE_DURATION.SUCCESS);
        return true;
      } catch (error) {
        onErrorRef.current(getErrorMessage(error, 'Error updating entry'));
        return false;
      } finally {
        setUploading(false);
      }
    },
    [setTrackedTimeout]
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
          onErrorRef.current(`Invalid file type received: ${contentType || 'unknown'}. Download blocked for security.`);
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

        onSuccessRef.current('File downloaded successfully');
        setTrackedTimeout(() => onSuccessRef.current(''), MESSAGE_DURATION.SUCCESS);
      } catch (error) {
        onErrorRef.current(getErrorMessage(error, 'Error downloading file'));
      }
    },
    [setTrackedTimeout]
  );

  const handleDelete = useCallback(
    async (fileToDelete: FileData) => {
      setDeleting(true);

      try {
        await api.delete(`/files/${fileToDelete.id}`);
        onSuccessRef.current('File deleted successfully');
        await onRefreshRef.current();

        setTrackedTimeout(() => onSuccessRef.current(''), MESSAGE_DURATION.SUCCESS);
        return true;
      } catch (error) {
        onErrorRef.current(getErrorMessage(error, 'Error deleting file'));
        return false;
      } finally {
        setDeleting(false);
      }
    },
    [setTrackedTimeout]
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
