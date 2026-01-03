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

// Cache configuration
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds
interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

// In-memory cache for invoice data
const invoiceCache = new Map<string, CacheEntry<Invoice[]>>();

// Helper to check if cache is valid
function isCacheValid(entry: CacheEntry<any> | undefined): boolean {
    if (!entry) return false;
    return Date.now() - entry.timestamp < CACHE_TTL;
}

// Helper to get from cache
function getFromCache(key: string): Invoice[] | null {
    const entry = invoiceCache.get(key);
    if (isCacheValid(entry)) {
        return entry!.data;
    }
    // Clear expired cache
    invoiceCache.delete(key);
    return null;
}

// Helper to set cache
function setCache(key: string, data: Invoice[]): void {
    invoiceCache.set(key, {
        data,
        timestamp: Date.now(),
    });
}

// Helper to clear cache for a project
function clearProjectCache(projectId: string): void {
    invoiceCache.delete(`project:${projectId}`);
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
        // Clear cache for this project since we added a new invoice
        clearProjectCache(data.projectId);
        return response.data;
    },

    async updateStatus(id: string, status: InvoiceStatus) {
        const response = await api.patch<Invoice>(`/invoices/${id}/status`, { status });
        // Clear all project caches since we don't know which project this belongs to
        invoiceCache.clear();
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
     * Get invoices for a specific project (with caching)
     */
    async getByProject(projectId: string): Promise<Invoice[]> {
        const cacheKey = `project:${projectId}`;

        // Try to get from cache first
        const cached = getFromCache(cacheKey);
        if (cached) {
            return cached;
        }

        // Fetch from API if not in cache or expired
        const response = await api.get<Invoice[]>(`/invoices?projectId=${projectId}`);
        const invoices = response.data;

        // Store in cache
        setCache(cacheKey, invoices);

        return invoices;
    },

    /**
     * Get pending invoices for a project (not paid yet)
     * Uses cached data from getByProject
     */
    async getPendingByProject(projectId: string) {
        const invoices = await this.getByProject(projectId);
        return invoices.filter(
            (inv) => inv.status === InvoiceStatus.SENT || inv.status === InvoiceStatus.OVERDUE
        );
    },

    /**
     * Get all deadlines from invoices for a project
     * Uses cached data from getByProject
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
     * Uses cached data from getPendingByProject
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
     * Uses cached data from getByProject
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
     * Manually clear cache for a project (useful after mutations)
     */
    clearCache(projectId?: string) {
        if (projectId) {
            clearProjectCache(projectId);
        } else {
            invoiceCache.clear();
        }
    },

    /**
     * Check if a project has any unpaid invoices
     */
    async hasUnpaidInvoices(projectId: string): Promise<boolean> {
        const response = await api.get<{ hasUnpaidInvoices: boolean }>(`/invoices/project/${projectId}/has-unpaid`);
        return response.data.hasUnpaidInvoices;
    },
};
