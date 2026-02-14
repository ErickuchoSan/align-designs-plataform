import { useState, useCallback, useRef, useEffect } from 'react';
import { api } from '@/lib/api';
import { handleApiError } from '@/lib/errors';
import { MESSAGE_DURATION, FILE_UPLOAD } from '@/lib/constants/ui.constants';
import type { FileData } from './useProjectFiles';
import { logger } from '@/lib/logger';

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
    async (files: File[], comment: string, stage?: string) => {
      // Validate inputs
      if (!files || files.length === 0) return false;

      // Validate all files first
      for (const file of files) {
        if (file.size > FILE_UPLOAD.MAX_SIZE_BYTES) {
          const fileSizeGB = (file.size / 1024 / 1024 / 1024).toFixed(2);
          const maxSizeGB = (FILE_UPLOAD.MAX_SIZE_MB / 1000).toFixed(0);
          onErrorRef.current(`File "${file.name}" exceeds size limit of ${maxSizeGB}GB.`);
          return false;
        }
      }

      setUploading(true);
      setUploadProgress(0);

      try {
        let successCount = 0;
        const totalFiles = files.length;

        for (let i = 0; i < totalFiles; i++) {
          const file = files[i];
          const fileComment = i === 0 ? comment : ''; // Attach comment to first file only (or all? usually first)

          const formData = new FormData();
          formData.append('file', file);
          if (fileComment) formData.append('comment', fileComment);
          if (stage) formData.append('stage', stage);

          try {
            await api.post(`/files/${projectId}/upload`, formData, {
              headers: { 'Content-Type': 'multipart/form-data' },
              onUploadProgress: (progressEvent) => {
                // Approximate progress for current file in total context
                if (progressEvent.total) {
                  const filePercent = (progressEvent.loaded / progressEvent.total) * 100;
                  const totalPercent = ((i * 100) + filePercent) / totalFiles;
                  setUploadProgress(Math.round(totalPercent));
                }
              },
            });
            successCount++;
          } catch (err) {
            logger.error(`Failed to upload ${file.name}`, err);
          }
        }

        if (successCount === totalFiles) {
          onSuccessRef.current(totalFiles > 1 ? 'Files uploaded successfully' : 'File uploaded successfully');
        } else if (successCount > 0) {
          onSuccessRef.current(`${successCount} of ${totalFiles} files uploaded.`);
        } else {
          throw new Error('All uploads failed');
        }

        await onRefreshRef.current();
        setTrackedTimeout(() => onSuccessRef.current(''), MESSAGE_DURATION.SUCCESS);
        return true;
      } catch (error) {
        onErrorRef.current(handleApiError(error, 'Error uploading files'));
        return false;
      } finally {
        setUploading(false);
        setUploadProgress(0);
      }
    },
    [projectId, setTrackedTimeout]
  );

  const handleCreateComment = useCallback(
    async (comment: string, files: File[], stage?: string, relatedFileId?: string) => {
      // Validate inputs
      if (!comment.trim() && files.length === 0) return false;

      setUploading(true);

      try {
        // CASE A: Files attached - Upload each file
        if (files.length > 0) {
          let totalSuccess = true;

          for (let i = 0; i < files.length; i++) {
            const file = files[i];

            // Only attach the full comment to the first file to avoid duplication
            // For others, we could leave empty or add a reference
            const fileComment = i === 0 ? comment : '';

            // Re-use internal file upload logic manually to avoid state conflicts if we called handleFileUpload
            const formData = new FormData();
            formData.append('file', file);
            if (fileComment) {
              formData.append('comment', fileComment);
            }
            if (stage) {
              formData.append('stage', stage);
            }
            if (relatedFileId) {
              formData.append('relatedFileId', relatedFileId);
            }

            try {
              await api.post(`/files/${projectId}/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
              });
            } catch (err) {
              logger.error(`Failed to upload file ${file.name}`, err);
              totalSuccess = false;
              // Continue uploading others? Yes.
            }
          }

          if (totalSuccess) {
            onSuccessRef.current('Feedback created successfully');
          } else {
            onErrorRef.current('Some files failed to upload');
          }

          await onRefreshRef.current();
          setTrackedTimeout(() => onSuccessRef.current(''), MESSAGE_DURATION.SUCCESS);
          return totalSuccess;

        } else {
          // CASE B: Text only comment
          await api.post(`/files/${projectId}/comment`, {
            comment: comment,
            stage: stage,
            relatedFileId: relatedFileId,
          });

          onSuccessRef.current('Comment created successfully');
          await onRefreshRef.current();
          setTrackedTimeout(() => onSuccessRef.current(''), MESSAGE_DURATION.SUCCESS);
          return true;
        }

      } catch (error) {
        onErrorRef.current(handleApiError(error, 'Error creating feedback'));
        return false;
      } finally {
        setUploading(false);
      }
    },
    [projectId, setTrackedTimeout]
  );

  const handleEditEntry = useCallback(
    async (fileToEdit: FileData, editComment: string, editFiles: File[]) => {
      setUploading(true);
      let successCount = 0;
      let hasError = false;

      try {
        // 1. Update the existing file (PATCH) - optionally replacing content with first file
        const updateFormData = new FormData();

        // Always send comment if changed (or even if not, to ensure sync? logic says if changed)
        if (editComment !== fileToEdit.comment) {
          updateFormData.append('comment', editComment);
        }

        const primaryFile = editFiles.length > 0 ? editFiles[0] : null;

        if (primaryFile) {
          updateFormData.append('file', primaryFile);
        }

        // Only call patch if there's something to update
        if (editComment !== fileToEdit.comment || primaryFile) {
          try {
            await api.patch(`/files/${fileToEdit.id}`, updateFormData, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });
            successCount++;
          } catch (error) {
            logger.error('Error updating original file:', error);
            hasError = true;
          }
        } else {
          // Nothing to update on primary file
          successCount++;
        }

        // 2. Upload any additional files (POST) as new entries
        if (editFiles.length > 1) {
          const additionalFiles = editFiles.slice(1);
          for (const file of additionalFiles) {
            const formData = new FormData();
            formData.append('file', file);
            // Should we attach the same comment? 
            // Context implicitly implies these are related. 
            // But usually "Edit" comment applies to the Main file. 
            // Let's add the comment to new files too if it exists, or leave blank?
            // User said "recuerda que al editar me permite subir mas de un archivo... o sin archivos pero si con comentarios..."
            // Safest is maybe NO comment on extras unless user specified?
            // Or maybe the SAME comment? 
            // Let's assume SAME comment for now as they are a "batch" logically.
            if (editComment) {
              formData.append('comment', editComment);
            }
            // Important: Use the same STAGE as the original file
            if (fileToEdit.stage) {
              formData.append('stage', fileToEdit.stage);
            }

            try {
              await api.post(`/files/${projectId}/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
              });
              successCount++;
            } catch (err) {
              logger.error('Error uploading additional file:', err);
              hasError = true;
            }
          }
        }

        if (hasError) {
          onErrorRef.current('Some changes failed to save.');
        } else {
          onSuccessRef.current('Entry updated successfully');
        }

        await onRefreshRef.current();
        setTrackedTimeout(() => onSuccessRef.current(''), MESSAGE_DURATION.SUCCESS);
        return !hasError;

      } catch (error) {
        onErrorRef.current(handleApiError(error, 'Error updating entry'));
        return false;
      } finally {
        setUploading(false);
      }
    },
    [projectId, setTrackedTimeout]
  );

  const handleDownload = useCallback(
    async (fileId: string, fileName: string) => {
      try {
        // Step 1: Get presigned download URL from backend
        const response = await api.get(`/files/${fileId}/download`);
        const { downloadUrl } = response.data;

        if (!downloadUrl) {
          onErrorRef.current('No download URL available for this file');
          return;
        }

        // Step 2: Download file directly from MinIO using presigned URL
        // This bypasses CORS and uses the presigned URL's authentication
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.setAttribute('download', fileName);
        link.setAttribute('target', '_blank');
        document.body.appendChild(link);
        link.click();
        link.remove();

        onSuccessRef.current('File download started');
        setTrackedTimeout(() => onSuccessRef.current(''), MESSAGE_DURATION.SUCCESS);
      } catch (error) {
        onErrorRef.current(handleApiError(error, 'Error downloading file'));
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
        onErrorRef.current(handleApiError(error, 'Error deleting file'));
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
