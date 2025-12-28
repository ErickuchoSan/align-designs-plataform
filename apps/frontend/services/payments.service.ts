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

    static async findAllByProject(projectId: string): Promise<Payment[]> {
        const response = await api.get<Payment[]>(`${this.BASE_URL}/project/${projectId}`);
        return response.data;
    }
}
