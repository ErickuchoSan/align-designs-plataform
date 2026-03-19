import { useCallback, useState } from 'react';
import { PaymentsService } from '@/services/payments.service';
import { EmployeePaymentsService } from '@/services/employee-payments.service';
import { handleApiError } from '@/lib/errors';
import { toast } from '@/lib/toast';

// When true, fetches files as blobs to avoid DNS issues with MinIO
// Set to false when MinIO DNS is properly configured
export const USE_BLOB_URLS = process.env.NEXT_PUBLIC_USE_BLOB_URLS === 'true';

type PaymentType = 'payment' | 'employee-payment';

/**
 * Hook for opening receipt files in a new tab
 * Supports both blob URLs (for DNS issues) and direct presigned URLs
 */
export function useReceiptViewer() {
  const [loading, setLoading] = useState(false);

  const openReceipt = useCallback(async (paymentId: string, type: PaymentType = 'payment') => {
    setLoading(true);
    try {
      if (USE_BLOB_URLS) {
        // Blob mode: download file and create object URL
        const blob = type === 'employee-payment'
          ? await EmployeePaymentsService.downloadReceipt(paymentId)
          : await PaymentsService.downloadReceipt(paymentId);
        const url = globalThis.URL.createObjectURL(blob);
        globalThis.open(url, '_blank');
      } else {
        // Direct URL mode: use presigned URL from API
        const url = type === 'employee-payment'
          ? await EmployeePaymentsService.getReceiptUrl(paymentId)
          : await PaymentsService.getReceiptUrl(paymentId);
        globalThis.open(url, '_blank');
      }
    } catch (error) {
      toast.error(handleApiError(error, 'Could not open receipt'));
    } finally {
      setLoading(false);
    }
  }, []);

  return { openReceipt, loading };
}