import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query';
import { ProjectsService } from '@/services/projects.service';
import { queryKeys } from '@/lib/query-keys';
import { toast } from '@/lib/toast';
import type { CreateProjectDto, UpdateProjectDto } from '@/types';

interface ProjectsListParams {
  page?: number;
  limit?: number;
  status?: string;
}

/**
 * Query hook for fetching projects list with pagination
 */
export function useProjectsListQuery(
  params: ProjectsListParams = {},
  options?: { enabled?: boolean }
) {
  const { page = 1, limit = 10, status } = params;

  return useQuery({
    queryKey: queryKeys.projects.list({ page, limit, status }),
    queryFn: () => ProjectsService.getAll({ page, limit, status }),
    placeholderData: keepPreviousData,
    enabled: options?.enabled ?? true,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Query hook for fetching a single project
 */
export function useProjectQuery(projectId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.projects.detail(projectId),
    queryFn: () => ProjectsService.getById(projectId),
    enabled: (options?.enabled ?? true) && !!projectId,
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Mutation hook for creating a project
 */
export function useCreateProjectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProjectDto) => ProjectsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() });
      toast.success('Project created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create project');
    },
  });
}

/**
 * Mutation hook for updating a project
 */
export function useUpdateProjectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProjectDto }) =>
      ProjectsService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() });
      toast.success('Project updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update project');
    },
  });
}

/**
 * Mutation hook for deleting a project
 */
export function useDeleteProjectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => ProjectsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() });
      toast.success('Project deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete project');
    },
  });
}

/**
 * Mutation hook for assigning employees to a project
 */
export function useAssignEmployeesMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, employeeIds }: { projectId: string; employeeIds: string[] }) =>
      ProjectsService.assignEmployees(projectId, employeeIds),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(variables.projectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.availableEmployees() });
      toast.success('Employees assigned successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to assign employees');
    },
  });
}

/**
 * Mutation hook for updating project status
 */
export function useUpdateProjectStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, status }: { projectId: string; status: string }) =>
      ProjectsService.updateStatus(projectId, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(variables.projectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() });
      toast.success('Project status updated');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update status');
    },
  });
}