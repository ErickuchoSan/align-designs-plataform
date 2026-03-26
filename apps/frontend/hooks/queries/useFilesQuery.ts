import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { FilesService, FileData } from '@/services/files.service';
import { ProjectsService } from '@/services/projects.service';
import { queryKeys } from '@/lib/query-keys';
import { toast } from '@/lib/toast';
import { handleApiError } from '@/lib/errors';
import type { FileFilters } from '@/types';

interface ProjectFilesParams {
  page?: number;
  limit?: number;
  name?: string;
  type?: string;
}

/**
 * Query hook for fetching project files with pagination and filters
 */
export function useProjectFilesQuery(
  projectId: string,
  params: ProjectFilesParams = {},
  options?: { enabled?: boolean }
) {
  const { page = 1, limit = 10, name, type } = params;
  const filters: Partial<FileFilters> = { page, limit };
  if (name) filters.name = name;
  if (type && type !== 'all') filters.type = type;

  return useQuery({
    queryKey: queryKeys.files.list(projectId, { page, limit, name, type }),
    queryFn: () => FilesService.getProjectFiles(projectId, filters),
    placeholderData: keepPreviousData,
    enabled: (options?.enabled ?? true) && !!projectId,
    staleTime: 30 * 1000,
  });
}

/**
 * Query hook for fetching available file types for a project
 */
export function useProjectFileTypesQuery(
  projectId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.files.types(projectId),
    queryFn: () => FilesService.getProjectFileTypes(projectId),
    enabled: (options?.enabled ?? true) && !!projectId,
    staleTime: 60 * 1000,
  });
}

/**
 * Query hook for fetching pending payment files for an employee
 */
export function usePendingPaymentFilesQuery(
  projectId: string,
  employeeId: string,
  options?: { enabled?: boolean }
) {
  return useQuery<FileData[]>({
    queryKey: queryKeys.files.pendingPayment(projectId, employeeId),
    queryFn: () => FilesService.getPendingPaymentFiles(projectId, employeeId),
    enabled: (options?.enabled ?? true) && !!projectId && !!employeeId,
    staleTime: 30 * 1000,
  });
}

/**
 * Mutation hook for uploading a new file version
 */
export function useUploadFileVersionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      parentFileId,
      file,
      notes,
    }: {
      parentFileId: string;
      file: File;
      notes?: string;
    }) => ProjectsService.uploadFileVersion(parentFileId, file, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.files.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
      toast.success('New version uploaded successfully');
    },
    onError: (error: Error) => {
      toast.error(handleApiError(error, 'Failed to upload new version'));
    },
  });
}