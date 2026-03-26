import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { EmployeePaymentsService } from '@/services/employee-payments.service';
import { queryKeys } from '@/lib/query-keys';
import { toast } from '@/lib/toast';
import { handleApiError } from '@/lib/errors';

/**
 * Query hook for fetching pending items for an employee in a project
 */
export function usePendingItemsQuery(
  projectId: string,
  employeeId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.employeePayments.pendingItems(projectId, employeeId),
    queryFn: () => EmployeePaymentsService.getPendingItems(projectId, employeeId),
    enabled: (options?.enabled ?? true) && !!projectId && !!employeeId,
    staleTime: 30 * 1000,
  });
}

interface CreateEmployeePaymentData {
  employeeId: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  description?: string;
  projectItemIds?: string[];
}

/**
 * Mutation hook for creating an employee payment
 */
export function useCreateEmployeePaymentMutation(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateEmployeePaymentData) =>
      EmployeePaymentsService.create(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.employeePayments.byProject(projectId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.detail(projectId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.all });
      toast.success('Payment recorded successfully');
    },
    onError: (error: Error) => {
      toast.error(handleApiError(error, 'Failed to record payment'));
    },
  });
}