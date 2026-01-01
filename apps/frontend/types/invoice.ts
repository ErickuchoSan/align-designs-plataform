export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  projectId: string;
  clientId: string;
  issueDate: string;
  dueDate: string;
  paymentTermsDays: number;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  amountPaid: number;
  status: InvoiceStatus;
  invoiceFileUrl?: string | null;
  notes?: string | null;
  sentToClientAt?: string | null;
  createdAt: string;
  updatedAt: string;
  project?: {
    name: string;
  };
  client?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  payments?: any[];
}

export interface CreateInvoiceDto {
  projectId: string;
  clientId?: string; // Optional if backend infers it from Project
  issueDate?: string;
  dueDate: string;
  paymentTermsDays?: number;
  subtotal?: number;
  taxAmount?: number;
  totalAmount: number;
  notes?: string;
  items?: { description: string; quantity: number; unitPrice: number }[];
  status?: string;
}

export interface InvoiceMetrics {
  totalSent: number;
  totalPaid: number;
  totalOverdue: number;
  totalRevenue: number;
}
