'use client';

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Invoice } from '@/types/invoice';
import { EmployeePayment } from '@/types/employee-payment';
import { Payment } from '@/types/payments';
import { toast } from '@/lib/toast';
import {
  usePaymentStageDataQuery,
  useApproveEmployeePaymentMutation,
  useRejectEmployeePaymentMutation,
} from '@/hooks/queries';
import { queryKeys } from '@/lib/query-keys';

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
  const queryClient = useQueryClient();

  // TanStack Query: fetch payment stage data based on role
  const { data, isLoading, error: queryError, refetch: refetchQuery } = usePaymentStageDataQuery(
    projectId,
    userRole
  );

  // TanStack Query: mutations
  const approveMutation = useApproveEmployeePaymentMutation();
  const rejectMutation = useRejectEmployeePaymentMutation();

  const invoices = data?.invoices || [];
  const employeePayments = data?.employeePayments || [];
  const clientPayments = data?.clientPayments || [];
  const error = queryError ? (queryError as Error).message : null;

  const refetch = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: queryKeys.projects.payments(projectId),
    });
    await refetchQuery();
  }, [queryClient, projectId, refetchQuery]);

  const approvePayment = useCallback(
    async (paymentId: string, file: File): Promise<boolean> => {
      try {
        await approveMutation.mutateAsync({ paymentId, file });
        await refetch();
        return true;
      } catch {
        return false;
      }
    },
    [approveMutation, refetch]
  );

  const rejectPayment = useCallback(
    async (paymentId: string, reason: string): Promise<boolean> => {
      if (!reason.trim()) {
        toast.error('Rejection reason is required');
        return false;
      }

      try {
        await rejectMutation.mutateAsync({ paymentId, reason });
        await refetch();
        return true;
      } catch {
        return false;
      }
    },
    [rejectMutation, refetch]
  );

  return {
    invoices,
    employeePayments,
    clientPayments,
    loading: isLoading,
    error,
    refetch,
    approvePayment,
    rejectPayment,
    approvingPayment: approveMutation.isPending,
    rejectingPayment: rejectMutation.isPending,
  };
}