import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { PaymentsService } from '@/services/payments.service';
import { InvoicesService } from '@/services/invoices.service';
import { EmployeePaymentsService } from '@/services/employee-payments.service';
import { ProjectsService } from '@/services/projects.service';
import { queryKeys } from '@/lib/query-keys';
import { toast } from '@/lib/toast';
import { handleApiError } from '@/lib/errors';

/**
 * Query hook for fetching payments by project
 */
export function useProjectPaymentsQuery(
  projectId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.projects.payments(projectId),
    queryFn: () => PaymentsService.findAllByProject(projectId),
    enabled: (options?.enabled ?? true) && !!projectId,
    staleTime: 30 * 1000,
  });
}

/**
 * Query hook for fetching invoices by project
 */
export function useProjectInvoicesQuery(
  projectId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: [...queryKeys.invoices.all, 'project', projectId],
    queryFn: () => InvoicesService.getByProject(projectId),
    enabled: (options?.enabled ?? true) && !!projectId,
    staleTime: 30 * 1000,
  });
}

/**
 * Mutation hook for approving a payment (with optional amount correction)
 */
export function useApprovePaymentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      paymentId,
      correctedAmount,
    }: {
      paymentId: string;
      correctedAmount?: number;
    }) => PaymentsService.approve(paymentId, correctedAmount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
      toast.success('Payment approved successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to approve payment');
    },
  });
}

/**
 * Mutation hook for rejecting a payment
 */
export function useRejectPaymentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ paymentId, reason }: { paymentId: string; reason: string }) =>
      PaymentsService.reject(paymentId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
      toast.success('Payment rejected');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to reject payment');
    },
  });
}

/**
 * Mutation hook for recording a new payment
 */
export function useRecordPaymentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: FormData) => PaymentsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
      toast.success('Payment recorded successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to record payment');
    },
  });
}

/**
 * Query hook for fetching employee payments by project
 */
export function useEmployeePaymentsByProjectQuery(
  projectId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.employeePayments.byProject(projectId),
    queryFn: () => EmployeePaymentsService.getByProject(projectId),
    enabled: (options?.enabled ?? true) && !!projectId,
    staleTime: 30 * 1000,
  });
}

/**
 * Query hook for fetching combined payment page data (payments, invoices, project)
 */
export function usePaymentPageDataQuery(
  projectId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: [...queryKeys.projects.payments(projectId), 'page-data'],
    queryFn: async () => {
      const [payments, invoices, project] = await Promise.all([
        PaymentsService.findAllByProject(projectId),
        InvoicesService.getByProject(projectId),
        ProjectsService.getById(projectId),
      ]);
      return { payments, invoices, project };
    },
    enabled: (options?.enabled ?? true) && !!projectId,
    staleTime: 30 * 1000,
  });
}

type UserRole = 'ADMIN' | 'CLIENT' | 'EMPLOYEE';

/**
 * Query hook for fetching payment stage data based on user role
 */
export function usePaymentStageDataQuery(
  projectId: string,
  userRole: UserRole,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: [...queryKeys.projects.payments(projectId), 'stage', userRole],
    queryFn: async () => {
      const results: {
        invoices: Awaited<ReturnType<typeof InvoicesService.getByProject>>;
        employeePayments: Awaited<ReturnType<typeof EmployeePaymentsService.getByProject>>;
        clientPayments: Awaited<ReturnType<typeof PaymentsService.findAllByProject>>;
      } = {
        invoices: [],
        employeePayments: [],
        clientPayments: [],
      };

      // Load invoices (Admin and Client only)
      if (userRole === 'ADMIN' || userRole === 'CLIENT') {
        results.invoices = await InvoicesService.getByProject(projectId);
      }

      // Load employee payments (Admin and Employee only)
      if (userRole === 'ADMIN' || userRole === 'EMPLOYEE') {
        results.employeePayments = await EmployeePaymentsService.getByProject(projectId);
      }

      // Load client payments (Admin and Client)
      if (userRole === 'ADMIN' || userRole === 'CLIENT') {
        const allPayments = await PaymentsService.findAllByProject(projectId);
        results.clientPayments = allPayments.filter(
          (p) => p.type === 'INITIAL_PAYMENT' || p.type === 'INVOICE'
        );
      }

      return results;
    },
    enabled: (options?.enabled ?? true) && !!projectId,
    staleTime: 30 * 1000,
  });
}

/**
 * Mutation hook for approving an employee payment
 */
export function useApproveEmployeePaymentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ paymentId, file }: { paymentId: string; file: File }) =>
      EmployeePaymentsService.approve(paymentId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.employeePayments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
      toast.success('Payment approved successfully');
    },
    onError: (error: Error) => {
      toast.error(handleApiError(error, 'Failed to approve payment'));
    },
  });
}

/**
 * Mutation hook for rejecting an employee payment
 */
export function useRejectEmployeePaymentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ paymentId, reason }: { paymentId: string; reason: string }) =>
      EmployeePaymentsService.reject(paymentId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.employeePayments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
      toast.success('Payment rejected');
    },
    onError: (error: Error) => {
      toast.error(handleApiError(error, 'Failed to reject payment'));
    },
  });
}