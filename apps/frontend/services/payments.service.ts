import api from '../lib/api';
import { Payment } from '../types/payments';

export class PaymentsService {
    private static readonly BASE_URL = '/payments';

    static async create(data: FormData): Promise<Payment> {
        // Axios auto-detects FormData and sets correct Content-Type with boundary
        const response = await api.post<Payment>(this.BASE_URL, data);
        return response.data;
    }

    static async uploadClientPayment(data: FormData): Promise<Payment> {
        // Axios auto-detects FormData and sets correct Content-Type with boundary
        // Don't override headers to preserve CSRF token from interceptor
        const response = await api.post<Payment>(`${this.BASE_URL}/client-upload`, data);
        return response.data;
    }

    static async findAllByProject(projectId: string): Promise<Payment[]> {
        const response = await api.get<Payment[]>(`${this.BASE_URL}/project/${projectId}`);
        return response.data;
    }

    static async approve(paymentId: string, correctedAmount?: number): Promise<Payment> {
        const response = await api.patch<Payment>(`${this.BASE_URL}/${paymentId}/approve`, {
            correctedAmount,
        });
        return response.data;
    }

    static async reject(paymentId: string, reason: string): Promise<Payment> {
        const response = await api.patch<Payment>(`${this.BASE_URL}/${paymentId}/reject`, {
            rejectionReason: reason,
        });
        return response.data;
    }

    static async getReceiptUrl(paymentId: string): Promise<string> {
        const response = await api.get<{ url: string }>(`${this.BASE_URL}/${paymentId}/receipt-url`);
        return response.data.url;
    }

    /**
     * Download receipt file as blob for viewing
     * Uses the presigned URL to fetch the file and return as blob
     */
    static async downloadReceipt(paymentId: string): Promise<Blob> {
        const presignedUrl = await this.getReceiptUrl(paymentId);
        // Fetch the file from the presigned URL
        const response = await fetch(presignedUrl);
        if (!response.ok) {
            throw new Error('Failed to download receipt');
        }
        return response.blob();
    }
}
