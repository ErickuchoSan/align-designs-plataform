import api from '../lib/api';
import { Project, User } from '@/types';

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
    invoiceFileUrl?: string;
    notes?: string;
    sentToClientAt?: string;
    createdAt: string;
    updatedAt: string;
    project?: Project;
    client?: User;
}

export interface CreateInvoiceDto {
    projectId: string;
    clientId: string;
    issueDate: string;
    dueDate: string;
    paymentTermsDays: number;
    subtotal: number;
    taxAmount?: number;
    totalAmount: number;
    notes?: string;
}

export const InvoicesService = {
    async getAll(filters?: { projectId?: string; clientId?: string }) {
        const params = new URLSearchParams();
        if (filters?.projectId) params.append('projectId', filters.projectId);
        if (filters?.clientId) params.append('clientId', filters.clientId);

        const response = await api.get<Invoice[]>(`/invoices?${params.toString()}`);
        return response.data;
    },

    async getOne(id: string) {
        const response = await api.get<Invoice>(`/invoices/${id}`);
        return response.data;
    },

    async create(data: CreateInvoiceDto) {
        const response = await api.post<Invoice>('/invoices', data);
        return response.data;
    },

    async updateStatus(id: string, status: InvoiceStatus) {
        const response = await api.patch<Invoice>(`/invoices/${id}/status`, { status });
        return response.data;
    },

    async getMetrics() {
        const response = await api.get<{
            totalSent: number;
            totalPaid: number;
            totalOverdue: number;
            totalRevenue: number;
        }>('/invoices/metrics');
        return response.data;
    }
};
