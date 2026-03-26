import { useMemo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { PaymentsService } from '@/services/payments.service';
import { InvoicesService } from '@/services/invoices.service';
import { Payment } from '@/types/payments';
import { Invoice } from '@/types/invoice';
import { Project } from '@/types';
import { toast } from '@/lib/toast';
import { handleApiError } from '@/lib/errors';
import { usePaymentPageDataQuery } from '@/hooks/queries';
import { queryKeys } from '@/lib/query-keys';

export interface UseProjectPaymentsReturn {
  payments: Payment[];
  invoices: Invoice[];
  project: Project | null;
  isLoading: boolean;
  pendingAmount: number;
  remainingAmount: number;
  isFullyCovered: boolean;
  loadData: () => Promise<void>;
  handleViewInvoice: (invoiceId: string) => Promise<void>;
  handleViewReceipt: (payment: Payment) => Promise<void>;
}

export function useProjectPayments(projectId: string): UseProjectPaymentsReturn {
  const queryClient = useQueryClient();

  // TanStack Query: fetch all payment page data
  const { data, isLoading, refetch } = usePaymentPageDataQuery(projectId, {
    enabled: !!projectId,
  });

  const payments = data?.payments || [];
  const invoices = data?.invoices || [];
  const project = data?.project || null;

  const pendingAmount = useMemo(() => {
    return payments
      .filter((p) => p.status === 'PENDING_APPROVAL')
      .reduce((sum, p) => sum + Number(p.amount), 0);
  }, [payments]);

  const remainingAmount = useMemo(() => {
    if (!project?.initialAmountRequired) return 0;
    const paid = Number(project.amountPaid || 0);
    return Math.max(0, Number(project.initialAmountRequired) - paid - pendingAmount);
  }, [project?.initialAmountRequired, project?.amountPaid, pendingAmount]);

  const isFullyCovered = remainingAmount === 0;

  const loadData = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: queryKeys.projects.payments(projectId),
    });
    await refetch();
  }, [queryClient, projectId, refetch]);

  const handleViewInvoice = useCallback(async (invoiceId: string) => {
    try {
      const blob = await InvoicesService.downloadPdf(invoiceId);
      const url = globalThis.URL.createObjectURL(blob);
      globalThis.open(url, '_blank');
    } catch (error) {
      toast.error(handleApiError(error, 'Could not download invoice'));
    }
  }, []);

  const handleViewReceipt = useCallback(async (payment: Payment) => {
    try {
      const blob = await PaymentsService.downloadReceipt(payment.id);
      const url = globalThis.URL.createObjectURL(blob);
      globalThis.open(url, '_blank');
    } catch (error) {
      toast.error(handleApiError(error, 'Could not view receipt'));
    }
  }, []);

  return {
    payments,
    invoices,
    project,
    isLoading,
    pendingAmount,
    remainingAmount,
    isFullyCovered,
    loadData,
    handleViewInvoice,
    handleViewReceipt,
  };
}