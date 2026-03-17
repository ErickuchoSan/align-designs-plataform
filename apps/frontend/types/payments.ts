// Import and re-export payment enums from centralized enums file
import { PaymentType, PaymentMethod, PaymentStatus } from './enums';
export {
    PaymentType,
    PaymentMethod,
    PaymentStatus,
    PAYMENT_TYPE_LABELS,
    PAYMENT_METHOD_LABELS,
    PAYMENT_STATUS_LABELS,
} from './enums';

export interface Payment {
    id: string;
    projectId: string;
    type: PaymentType;
    amount: number;
    paymentMethod: PaymentMethod;
    paymentDate: string;
    receiptFileUrl?: string;
    invoiceId?: string;
    status: PaymentStatus;
    notes?: string;
    createdAt: string;
    reviewedBy?: string;
    reviewedAt?: string;
    rejectionReason?: string;
    fromUser?: {
        id: string;
        firstName: string;
        lastName: string;
    };
    toUser?: {
        id: string;
        firstName: string;
        lastName: string;
    };
}

/**
 * Invoice deadline for workflow views
 * Shared between AdminWorkflowView and ClientWorkflowView
 */
export interface InvoiceDeadline {
  date: Date;
  label: string;
  invoiceId: string;
  amount: number;
}

/**
 * Payment progress tracking
 */
export interface PaymentProgress {
  paid: number;
  total: number;
  percentage: number;
  pendingInvoiceCount: number;
}
