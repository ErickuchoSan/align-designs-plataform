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

// Note: PAYMENT_METHOD_LABELS, PAYMENT_TYPE_LABELS, and PAYMENT_STATUS_LABELS
// are now exported from ./enums.ts (see re-exports at top of file)
