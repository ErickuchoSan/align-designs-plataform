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

  // Helper function to upload multiple files
  const uploadFiles = useCallback(
    async (files: File[], comment: string, stage?: string, relatedFileId?: string): Promise<boolean> => {
      let allSuccess = true;
      for (let i = 0; i < files.length; i++) {
        try {
          await FilesService.upload(projectId, {
            file: files[i],
            comment: i === 0 ? (comment || undefined) : undefined,
            stage,
            relatedFileId,
          });
        } catch {
          allSuccess = false;
        }
      }
      return allSuccess;
    },
    [projectId]
  );

  const handleCreateComment = useCallback(
    async (comment: string, files: File[], stage?: string, relatedFileId?: string) => {
      if (!comment.trim() && files.length === 0) return false;

      setUploading(true);

      try {
        const success = files.length > 0
          ? await uploadFiles(files, comment, stage, relatedFileId)
          : await FilesService.createComment(projectId, comment, stage, relatedFileId).then(() => true);

        let message: string;
        if (files.length > 0) {
          message = success ? 'Feedback created successfully' : 'Some files failed to upload';
        } else {
          message = 'Comment created successfully';
        }

        if (success) onSuccessRef.current(message);
        else onErrorRef.current(message);

        await onRefreshRef.current();
        setTrackedTimeout(() => onSuccessRef.current(''), MESSAGE_DURATION.SUCCESS);
        return success;

      } catch (error) {
        onErrorRef.current(handleApiError(error, 'Error creating feedback'));
        return false;
      } finally {
        setUploading(false);
      }
    },
    [projectId, setTrackedTimeout, uploadFiles]
  );

  // Helper function to update primary file
  const updatePrimaryFile = useCallback(
    async (fileToEdit: FileData, editComment: string, primaryFile?: File): Promise<boolean> => {
      const commentChanged = editComment !== fileToEdit.comment;
      if (!commentChanged && !primaryFile) return true;

      try {
        await FilesService.update(fileToEdit.id, {
          comment: commentChanged ? editComment : undefined,
          file: primaryFile,
        });
        return true;
      } catch {
        return false;
      }
    },
    []
  );

  // Helper function to upload additional files
  const uploadAdditionalFiles = useCallback(
    async (files: File[], comment: string, stage?: string): Promise<boolean> => {
      let allSuccess = true;
      for (const file of files) {
        try {
          await FilesService.upload(projectId, { file, comment: comment || undefined, stage });
        } catch {
          allSuccess = false;
        }
      }
      return allSuccess;
    },
    [projectId]
  );

  const handleEditEntry = useCallback(
    async (fileToEdit: FileData, editComment: string, editFiles: File[]) => {
      setUploading(true);

      try {
        const primaryFile = editFiles.length > 0 ? editFiles[0] : undefined;
        const primarySuccess = await updatePrimaryFile(fileToEdit, editComment, primaryFile);

        const additionalSuccess = editFiles.length > 1
          ? await uploadAdditionalFiles(editFiles.slice(1), editComment, fileToEdit.stage)
          : true;

        const success = primarySuccess && additionalSuccess;
        if (success) onSuccessRef.current('Entry updated successfully');
        else onErrorRef.current('Some changes failed to save.');

        await onRefreshRef.current();
        setTrackedTimeout(() => onSuccessRef.current(''), MESSAGE_DURATION.SUCCESS);
        return success;

      } catch (error) {
        onErrorRef.current(handleApiError(error, 'Error updating entry'));
        return false;
      } finally {
        setUploading(false);
      }
    },
    [setTrackedTimeout, updatePrimaryFile, uploadAdditionalFiles]
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
