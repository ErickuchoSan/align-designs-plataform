import api from '../lib/api';
import { Payment } from '../types/payments';

export class PaymentsService {
    private static readonly BASE_URL = '/payments';

    static async create(data: FormData): Promise<Payment> {
        const response = await api.post<Payment>(this.BASE_URL, data, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    }

    static async uploadClientPayment(data: FormData): Promise<Payment> {
        // Override default Content-Type to let browser set multipart/form-data with boundary
        const response = await api.post<Payment>(`${this.BASE_URL}/client-upload`, data, {
            headers: {
                'Content-Type': undefined, // This tells axios to let the browser set it
            },
        });
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
}
