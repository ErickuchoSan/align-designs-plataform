import { useState, useCallback, useRef, useEffect } from 'react';
import { handleApiError } from '@/lib/errors';
import { MESSAGE_DURATION, FILE_UPLOAD } from '@/lib/constants/ui.constants';
import { FilesService } from '@/services/files.service';
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
          const fileComment = i === 0 ? comment : '';

          try {
            await FilesService.upload(projectId, {
              file,
              comment: fileComment || undefined,
              stage,
              onUploadProgress: (progressEvent) => {
                if (progressEvent.total) {
                  const filePercent = (progressEvent.loaded / progressEvent.total) * 100;
                  const totalPercent = ((i * 100) + filePercent) / totalFiles;
                  setUploadProgress(Math.round(totalPercent));
                }
              },
            });
            successCount++;
          } catch {
            // Silent error - batch upload continues with other files
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
            const fileComment = i === 0 ? comment : '';

            try {
              await FilesService.upload(projectId, {
                file,
                comment: fileComment || undefined,
                stage,
                relatedFileId,
              });
            } catch {
              totalSuccess = false;
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
          await FilesService.createComment(projectId, comment, stage, relatedFileId);

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
        const primaryFile = editFiles.length > 0 ? editFiles[0] : undefined;
        const commentChanged = editComment !== fileToEdit.comment;

        // Only call patch if there's something to update
        if (commentChanged || primaryFile) {
          try {
            await FilesService.update(fileToEdit.id, {
              comment: commentChanged ? editComment : undefined,
              file: primaryFile,
            });
            successCount++;
          } catch {
            hasError = true;
          }
        } else {
          successCount++;
        }

        // 2. Upload any additional files (POST) as new entries
        if (editFiles.length > 1) {
          const additionalFiles = editFiles.slice(1);
          for (const file of additionalFiles) {
            try {
              await FilesService.upload(projectId, {
                file,
                comment: editComment || undefined,
                stage: fileToEdit.stage,
              });
              successCount++;
            } catch {
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
        const downloadUrl = await FilesService.getDownloadUrl(fileId);

        if (!downloadUrl) {
          onErrorRef.current('No download URL available for this file');
          return;
        }

        // Download file directly using presigned URL
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
        await FilesService.delete(fileToDelete.id);
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
