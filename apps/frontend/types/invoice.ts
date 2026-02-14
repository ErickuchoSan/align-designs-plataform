// Import and re-export InvoiceStatus from centralized enums file
import { InvoiceStatus } from './enums';
export { InvoiceStatus, INVOICE_STATUS_LABELS, INVOICE_STATUS_COLORS } from './enums';

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
    phone?: string;
  };
  payments?: { id: string; amount: number; paymentDate: string; paymentMethod: string; }[];
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
