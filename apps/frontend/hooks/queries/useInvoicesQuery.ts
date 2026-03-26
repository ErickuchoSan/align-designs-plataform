import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { InvoicesService } from '@/services/invoices.service';
import { queryKeys } from '@/lib/query-keys';
import { toast } from '@/lib/toast';
import { handleApiError } from '@/lib/errors';
import type { InvoiceStatus } from '@/types/invoice';

interface InvoiceFilters {
  clientId?: string;
  status?: InvoiceStatus;
}

/**
 * Query hook for fetching all invoices with optional filters
 */
export function useInvoicesListQuery(
  filters?: InvoiceFilters,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: [...queryKeys.invoices.lists(), filters || {}],
    queryFn: () => InvoicesService.getAll(filters),
    enabled: options?.enabled ?? true,
    staleTime: 30 * 1000,
  });
}

/**
 * Query hook for fetching a single invoice by ID
 */
export function useInvoiceQuery(
  invoiceId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.invoices.detail(invoiceId),
    queryFn: () => InvoicesService.getOne(invoiceId),
    enabled: (options?.enabled ?? true) && !!invoiceId,
    staleTime: 30 * 1000,
  });
}

/**
 * Mutation hook for updating invoice status
 */
export function useUpdateInvoiceStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ invoiceId, status }: { invoiceId: string; status: InvoiceStatus }) =>
      InvoicesService.updateStatus(invoiceId, status),
    onSuccess: (updatedInvoice) => {
      queryClient.setQueryData(
        queryKeys.invoices.detail(updatedInvoice.id),
        updatedInvoice
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.all });
      toast.success(`Invoice marked as ${updatedInvoice.status}`);
    },
    onError: (error: Error) => {
      toast.error(handleApiError(error, 'Failed to update status'));
    },
  });
}

/**
 * Query hook for fetching unpaid invoices by project
 */
export function useUnpaidInvoicesQuery(
  projectId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.invoices.unpaidByProject(projectId),
    queryFn: async () => {
      const invoices = await InvoicesService.getByProject(projectId);
      return invoices.filter(
        (inv) => inv.status !== 'PAID' && inv.status !== 'CANCELLED'
      );
    },
    enabled: (options?.enabled ?? true) && !!projectId,
    staleTime: 30 * 1000,
  });
}

/**
 * Query hook for checking if project has unpaid invoices
 */
export function useHasUnpaidInvoicesQuery(
  projectId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.invoices.hasUnpaid(projectId),
    queryFn: () => InvoicesService.hasUnpaidInvoices(projectId),
    enabled: (options?.enabled ?? true) && !!projectId,
    staleTime: 30 * 1000,
  });
}

/**
 * Query hook for fetching project details with client ID
 */
export function useProjectForInvoiceQuery(
  projectId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: [...queryKeys.invoices.hasUnpaid(projectId), 'project-data'],
    queryFn: async () => {
      const [hasUnpaid, project] = await Promise.all([
        InvoicesService.hasUnpaidInvoices(projectId),
        import('@/services/projects.service').then((m) =>
          m.ProjectsService.getById(projectId)
        ),
      ]);
      return {
        hasUnpaid,
        clientId: project?.clientId || null,
      };
    },
    enabled: (options?.enabled ?? true) && !!projectId,
    staleTime: 30 * 1000,
  });
}

interface CreateInvoiceData {
  projectId: string;
  clientId: string;
  issueDate: string;
  dueDate: string;
  paymentTermsDays: number;
  subtotal: number;
  totalAmount: number;
  notes?: string;
}

/**
 * Mutation hook for creating an invoice
 */
export function useCreateInvoiceMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateInvoiceData) =>
      InvoicesService.create(data as any),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.detail(variables.projectId),
      });
      toast.success('Invoice created successfully');
    },
    onError: (error: Error) => {
      toast.error(handleApiError(error, 'Failed to create invoice'));
    },
  });
}

/**
 * Mutation hook for uploading client payment
 */
export function useUploadClientPaymentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) =>
      import('@/services/payments.service').then((m) =>
        m.PaymentsService.uploadClientPayment(formData)
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
      toast.success('Payment submitted for review');
    },
    onError: (error: Error) => {
      toast.error(handleApiError(error, 'Failed to submit payment'));
    },
  });
}