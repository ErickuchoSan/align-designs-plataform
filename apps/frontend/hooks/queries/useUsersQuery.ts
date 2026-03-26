import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query';
import { UsersService } from '@/services/users.service';
import { queryKeys } from '@/lib/query-keys';
import { toast } from '@/lib/toast';
import type { User, CreateUserDto } from '@/types';

interface UsersListParams {
  page?: number;
  limit?: number;
  role?: string;
}

/**
 * Query hook for fetching users list with pagination
 */
export function useUsersListQuery(
  params: UsersListParams = {},
  options?: { enabled?: boolean }
) {
  const { page = 1, limit = 10, role } = params;

  return useQuery({
    queryKey: queryKeys.users.list({ page, limit, role }),
    queryFn: () => UsersService.getAll({ page, limit, role }),
    placeholderData: keepPreviousData,
    enabled: options?.enabled ?? true,
    staleTime: 30 * 1000,
  });
}

/**
 * Query hook for fetching a single user
 */
export function useUserQuery(userId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.users.detail(userId),
    queryFn: () => UsersService.getById(userId),
    enabled: (options?.enabled ?? true) && !!userId,
    staleTime: 60 * 1000,
  });
}

/**
 * Query hook for fetching clients only
 */
export function useClientsQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.users.clients(),
    queryFn: () => UsersService.getClients(),
    enabled: options?.enabled ?? true,
    staleTime: 60 * 1000,
  });
}

/**
 * Query hook for fetching all employees
 */
export function useEmployeesQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.users.employees(),
    queryFn: () => UsersService.getEmployees(),
    enabled: options?.enabled ?? true,
    staleTime: 30 * 1000,
  });
}

/**
 * Query hook for fetching available employees (not assigned to active projects)
 */
export function useAvailableEmployeesQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.users.availableEmployees(),
    queryFn: () => UsersService.getAvailableEmployees(),
    enabled: options?.enabled ?? true,
    staleTime: 30 * 1000,
  });
}

/**
 * Mutation hook for creating a user
 */
export function useCreateUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateUserDto) => UsersService.create(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
      if (variables.role === 'CLIENT') {
        queryClient.invalidateQueries({ queryKey: queryKeys.users.clients() });
      }
      toast.success(`${variables.role === 'CLIENT' ? 'Client' : 'Employee'} created successfully`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create user');
    },
  });
}

/**
 * Mutation hook for updating a user
 */
export function useUpdateUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<User> }) =>
      UsersService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
      toast.success('User updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update user');
    },
  });
}

/**
 * Mutation hook for toggling user status
 */
export function useToggleUserStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      UsersService.toggleStatus(id, isActive),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
      toast.success(`User ${variables.isActive ? 'activated' : 'deactivated'} successfully`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to change user status');
    },
  });
}

/**
 * Mutation hook for deleting a user
 */
export function useDeleteUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, force = false }: { id: string; force?: boolean }) =>
      UsersService.delete(id, { hard: true, force }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.clients() });
      toast.success('User deleted successfully');
    },
    onError: (error: Error) => {
      // Don't show toast for 409 - handled by component for force delete
      if (!error.message?.includes('409')) {
        toast.error(error.message || 'Failed to delete user');
      }
    },
  });
}

/**
 * Mutation hook for resending welcome email
 */
export function useResendWelcomeEmailMutation() {
  return useMutation({
    mutationFn: (userId: string) => UsersService.resendWelcomeEmail(userId),
    onSuccess: () => {
      toast.success('Welcome email sent successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to send welcome email');
    },
  });
}