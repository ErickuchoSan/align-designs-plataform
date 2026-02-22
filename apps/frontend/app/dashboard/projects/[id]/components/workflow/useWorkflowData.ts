'use client';

import { useState, useEffect, useCallback } from 'react';
import { Project, ProjectStatus } from '@/types';
import { Payment } from '@/types/payments';
import { InvoicesService } from '@/services/invoices.service';
import { PaymentsService } from '@/services/payments.service';
import { ProjectsService } from '@/services/projects.service';
import { handleApiError, logError } from '@/lib/errors';

interface InvoiceDeadline {
  date: Date;
  label: string;
  invoiceId: string;
  amount: number;
}

interface PaymentProgress {
  paid: number;
  total: number;
  percentage: number;
  pendingInvoiceCount: number;
}

interface UseWorkflowDataReturn {
  // Invoice data
  invoiceDeadlines: InvoiceDeadline[];
  paymentProgress: PaymentProgress;
  loadingInvoices: boolean;
  // Payment data
  payments: Payment[];
  pendingAmount: number;
  loadingPayments: boolean;
  // Completion data
  checklistData: any;
  checklistLoading: boolean;
  // Actions
  fetchCompletionStatus: () => Promise<void>;
  completeProject: () => Promise<boolean>;
  archiveProject: () => Promise<boolean>;
  // State
  processing: boolean;
  error: string;
  clearError: () => void;
}

export function useWorkflowData(project: Project, onUpdate: () => void): UseWorkflowDataReturn {
  // Invoice data
  const [invoiceDeadlines, setInvoiceDeadlines] = useState<InvoiceDeadline[]>([]);
  const [paymentProgress, setPaymentProgress] = useState<PaymentProgress>({
    paid: 0,
    total: 0,
    percentage: 0,
    pendingInvoiceCount: 0,
  });
  const [loadingInvoices, setLoadingInvoices] = useState(true);

  // Payment data
  const [payments, setPayments] = useState<Payment[]>([]);
  const [pendingAmount, setPendingAmount] = useState(0);
  const [loadingPayments, setLoadingPayments] = useState(false);

  // Completion data
  const [checklistData, setChecklistData] = useState<any>(null);
  const [checklistLoading, setChecklistLoading] = useState(false);

  // State
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  // Load invoices and calculate payment progress
  useEffect(() => {
    const loadInvoiceData = async () => {
      try {
        setLoadingInvoices(true);
        const [deadlines, progress] = await Promise.all([
          InvoicesService.getDeadlinesByProject(project.id),
          InvoicesService.getPaymentProgress(project.id),
        ]);
        setInvoiceDeadlines(deadlines);
        setPaymentProgress(progress);
      } catch {
        // Silent error - invoice data loading is non-critical
      } finally {
        setLoadingInvoices(false);
      }
    };

    loadInvoiceData();
  }, [project.id, project]);

  // Check for pending payments
  useEffect(() => {
    const checkPending = async () => {
      try {
        const paymentsData = await PaymentsService.findAllByProject(project.id);
        setPayments(paymentsData);
        const pending = paymentsData
          .filter((p: Payment) => p.status === 'PENDING_APPROVAL')
          .reduce((sum: number, p: Payment) => sum + Number(p.amount), 0);
        setPendingAmount(pending);
      } catch {
        // Silent error - pending payments check is non-critical
      }
    };
    checkPending();
  }, [project.id, project.amountPaid]);

  const fetchCompletionStatus = useCallback(async () => {
    setChecklistLoading(true);
    setError('');

    try {
      const status = await ProjectsService.getCompletionStatus(project.id);
      setChecklistData(status);
    } catch (err) {
      logError(err, 'Error fetching completion status');
      setError(handleApiError(err, 'Failed to fetch project status'));
    } finally {
      setChecklistLoading(false);
    }
  }, [project.id]);

  const completeProject = useCallback(async (): Promise<boolean> => {
    setProcessing(true);
    setError('');

    try {
      await ProjectsService.complete(project.id);
      onUpdate();
      return true;
    } catch (err) {
      logError(err, 'Error completing project');
      setError(handleApiError(err, 'Failed to complete project'));
      return false;
    } finally {
      setProcessing(false);
    }
  }, [project.id, onUpdate]);

  const archiveProject = useCallback(async (): Promise<boolean> => {
    setProcessing(true);
    setError('');

    try {
      await ProjectsService.archive(project.id);
      onUpdate();
      return true;
    } catch (err) {
      logError(err, 'Error archiving project');
      setError(handleApiError(err, 'Failed to archive project'));
      return false;
    } finally {
      setProcessing(false);
    }
  }, [project.id, onUpdate]);

  const clearError = useCallback(() => setError(''), []);

  return {
    invoiceDeadlines,
    paymentProgress,
    loadingInvoices,
    payments,
    pendingAmount,
    loadingPayments,
    checklistData,
    checklistLoading,
    fetchCompletionStatus,
    completeProject,
    archiveProject,
    processing,
    error,
    clearError,
  };
}
