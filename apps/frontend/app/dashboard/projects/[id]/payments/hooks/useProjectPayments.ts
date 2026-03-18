import { useState, useEffect, useCallback, useMemo } from 'react';
import { PaymentsService } from '@/services/payments.service';
import { InvoicesService } from '@/services/invoices.service';
import { ProjectsService } from '@/services/projects.service';
import { Payment } from '@/types/payments';
import { Invoice } from '@/types/invoice';
import { Project } from '@/types';
import { toast } from '@/lib/toast';
import { handleApiError } from '@/lib/errors';

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
  const [payments, setPayments] = useState<Payment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [paymentsData, invoicesData, projectData] = await Promise.all([
        PaymentsService.findAllByProject(projectId),
        InvoicesService.getByProject(projectId),
        ProjectsService.getById(projectId),
      ]);
      setPayments(paymentsData);
      setInvoices(invoicesData);
      setProject(projectData);
    } catch (error) {
      toast.error(handleApiError(error, 'Error loading payment information'));
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (projectId) {
      loadData();
    }
  }, [projectId, loadData]);

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

  const handleViewInvoice = async (invoiceId: string) => {
    try {
      const blob = await InvoicesService.downloadPdf(invoiceId);
      const url = globalThis.URL.createObjectURL(blob);
      globalThis.open(url, '_blank');
    } catch (error) {
      toast.error(handleApiError(error, 'Could not download invoice'));
    }
  };

  const handleViewReceipt = async (payment: Payment) => {
    try {
      const blob = await PaymentsService.downloadReceipt(payment.id);
      const url = globalThis.URL.createObjectURL(blob);
      globalThis.open(url, '_blank');
    } catch (error) {
      toast.error(handleApiError(error, 'Could not view receipt'));
    }
  };

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
