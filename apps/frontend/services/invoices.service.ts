import api from '../lib/api';
import { Invoice, InvoiceStatus, CreateInvoiceDto } from '@/types/invoice';

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
    },

    /**
     * Get invoices for a specific project
     */
    async getByProject(projectId: string): Promise<Invoice[]> {
        const response = await api.get<Invoice[]>(`/invoices?projectId=${projectId}`);
        return response.data;
    },

    /**
     * Get pending invoices for a project (not paid yet)
     */
    async getPendingByProject(projectId: string) {
        const invoices = await this.getByProject(projectId);
        return invoices.filter(
            (inv) => inv.status === InvoiceStatus.SENT || inv.status === InvoiceStatus.OVERDUE
        );
    },

    /**
     * Get all deadlines from invoices for a project
     */
    async getDeadlinesByProject(projectId: string): Promise<Array<{ date: Date; label: string; invoiceId: string; amount: number }>> {
        const invoices = await this.getByProject(projectId);
        return invoices
            .filter((inv) => inv.status !== InvoiceStatus.PAID && inv.status !== InvoiceStatus.CANCELLED)
            .map((inv) => ({
                date: new Date(inv.dueDate),
                label: `Invoice ${inv.invoiceNumber} Due`,
                invoiceId: inv.id,
                amount: inv.totalAmount - inv.amountPaid,
            }))
            .sort((a, b) => a.date.getTime() - b.date.getTime());
    },

    /**
     * Calculate total pending amount for a project
     */
    async getTotalPending(projectId: string): Promise<number> {
        const invoices = await this.getPendingByProject(projectId);
        return invoices.reduce(
            (total, inv) => total + (inv.totalAmount - inv.amountPaid),
            0
        );
    },

    /**
     * Calculate payment progress percentage for a project (all invoices)
     */
    async getPaymentProgress(projectId: string): Promise<{ paid: number; total: number; percentage: number; pendingInvoiceCount: number }> {
        const invoices = await this.getByProject(projectId);
        const total = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
        const paid = invoices.reduce((sum, inv) => sum + inv.amountPaid, 0);
        const percentage = total > 0 ? (paid / total) * 100 : 0;

        // Count invoices that are not fully paid and not cancelled
        const pendingInvoiceCount = invoices.filter(
            inv => inv.status !== InvoiceStatus.PAID && inv.status !== InvoiceStatus.CANCELLED
        ).length;

        return { paid, total, percentage, pendingInvoiceCount };
    },

    /**
     * Check if a project has any unpaid invoices
     */
    async hasUnpaidInvoices(projectId: string): Promise<boolean> {
        const response = await api.get<{ hasUnpaidInvoices: boolean }>(`/invoices/project/${projectId}/has-unpaid`);
        return response.data.hasUnpaidInvoices;
    },

    async downloadPdf(id: string): Promise<Blob> {
        const response = await api.get(`/invoices/${id}/pdf`, { responseType: 'blob' });
        return response.data;
    },
};
