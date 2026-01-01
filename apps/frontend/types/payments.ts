export enum PaymentType {
    INITIAL_PAYMENT = 'INITIAL_PAYMENT',
    INVOICE = 'INVOICE',
    EMPLOYEE_PAYMENT = 'EMPLOYEE_PAYMENT',
}

export enum PaymentMethod {
    TRANSFER = 'TRANSFER',
    CHECK = 'CHECK',
}

export enum PaymentStatus {
    PENDING_APPROVAL = 'PENDING_APPROVAL',
    CONFIRMED = 'CONFIRMED',
    REJECTED = 'REJECTED',
    PENDING_CONFIRMATION = 'PENDING_CONFIRMATION', // Legacy
}

export interface Payment {
    id: string;
    projectId: string;
    type: PaymentType;
    amount: number;
    paymentMethod: PaymentMethod;
    paymentDate: string;
    receiptFileUrl?: string;
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

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
    [PaymentMethod.TRANSFER]: 'Transferencia Bancaria',
    [PaymentMethod.CHECK]: 'Cheque',
};

export const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
    [PaymentType.INITIAL_PAYMENT]: 'Pago Inicial',
    [PaymentType.INVOICE]: 'Factura',
    [PaymentType.EMPLOYEE_PAYMENT]: 'Pago a Empleado',
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
    [PaymentStatus.PENDING_APPROVAL]: 'Pendiente de Aprobación',
    [PaymentStatus.CONFIRMED]: 'Confirmado',
    [PaymentStatus.REJECTED]: 'Rechazado',
    [PaymentStatus.PENDING_CONFIRMATION]: 'Pendiente', // Legacy
};
