'use client';

import { useState, useEffect, useCallback } from 'react';
import { InvoicesService } from '@/services/invoices.service';
import { EmployeePaymentsService } from '@/services/employee-payments.service';
import { PaymentsService } from '@/services/payments.service';
import { Invoice } from '@/types/invoice';
import { EmployeePayment } from '@/types/employee-payment';
import { Payment } from '@/types/payments';
import { toast } from '@/lib/toast';
import { handleApiError } from '@/lib/errors';

type UserRole = 'ADMIN' | 'CLIENT' | 'EMPLOYEE';

interface UsePaymentsStageProps {
  projectId: string;
  userRole: UserRole;
}

interface UsePaymentsStageReturn {
  invoices: Invoice[];
  employeePayments: EmployeePayment[];
  clientPayments: Payment[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  // Employee payment actions
  approvePayment: (paymentId: string, file: File) => Promise<boolean>;
  rejectPayment: (paymentId: string, reason: string) => Promise<boolean>;
  approvingPayment: boolean;
  rejectingPayment: boolean;
}

export function usePaymentsStage({
  projectId,
  userRole,
}: UsePaymentsStageProps): UsePaymentsStageReturn {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [employeePayments, setEmployeePayments] = useState<EmployeePayment[]>([]);
  const [clientPayments, setClientPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approvingPayment, setApprovingPayment] = useState(false);
  const [rejectingPayment, setRejectingPayment] = useState(false);

  const loadPaymentData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Load invoices (Admin and Client only)
      if (userRole === 'ADMIN' || userRole === 'CLIENT') {
        const invoiceData = await InvoicesService.getByProject(projectId);
        setInvoices(invoiceData);
      }

      // Load employee payments (Admin and Employee only)
      if (userRole === 'ADMIN' || userRole === 'EMPLOYEE') {
        const paymentData = await EmployeePaymentsService.getByProject(projectId);
        setEmployeePayments(paymentData);
      }

      // Load client payments (Admin and Client)
      if (userRole === 'ADMIN' || userRole === 'CLIENT') {
        const allPayments = await PaymentsService.findAllByProject(projectId);
        const clientPays = allPayments.filter(
          (p) => p.type === 'INITIAL_PAYMENT' || p.type === 'INVOICE'
        );
        setClientPayments(clientPays);
      }
    } catch (err) {
      const msg = handleApiError(err, 'Failed to load payment data');
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [projectId, userRole]);

  useEffect(() => {
    loadPaymentData();
  }, [loadPaymentData]);

  const approvePayment = useCallback(
    async (paymentId: string, file: File): Promise<boolean> => {
      setApprovingPayment(true);
      try {
        await EmployeePaymentsService.approve(paymentId, file);
        toast.success('Payment approved successfully');
        await loadPaymentData();
        return true;
      } catch (err) {
        toast.error(handleApiError(err, 'Failed to approve payment'));
        return false;
      } finally {
        setApprovingPayment(false);
      }
    },
    [loadPaymentData]
  );

  const rejectPayment = useCallback(
    async (paymentId: string, reason: string): Promise<boolean> => {
      if (!reason.trim()) {
        toast.error('Rejection reason is required');
        return false;
      }

      setRejectingPayment(true);
      try {
        await EmployeePaymentsService.reject(paymentId, reason);
        toast.success('Payment rejected');
        await loadPaymentData();
        return true;
      } catch (err) {
        toast.error(handleApiError(err, 'Failed to reject payment'));
        return false;
      } finally {
        setRejectingPayment(false);
      }
    },
    [loadPaymentData]
  );

  return {
    invoices,
    employeePayments,
    clientPayments,
    loading,
    error,
    refetch: loadPaymentData,
    approvePayment,
    rejectPayment,
    approvingPayment,
    rejectingPayment,
  };
}
