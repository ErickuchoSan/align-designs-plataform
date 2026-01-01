import api from '../lib/api';
import { FeedbackCycle, Feedback } from '../types/feedback';

export class FeedbackService {
    private static readonly BASE_URL = '/feedback';

    static async getProjectCycles(projectId: string): Promise<FeedbackCycle[]> {
        const response = await api.get<FeedbackCycle[]>(`${this.BASE_URL}/project/${projectId}`);
        return response.data;
    }

    static async createCycle(projectId: string, employeeId: string): Promise<FeedbackCycle> {
        const response = await api.post<FeedbackCycle>(`${this.BASE_URL}/cycle`, {
            projectId,
            employeeId,
        });
        return response.data;
    }

    static async addFeedback(data: {
        projectId: string;
        employeeId: string;
        targetAudience: 'client_space' | 'employee_space';
        content: string;
    }): Promise<Feedback> {
        const response = await api.post<Feedback>(this.BASE_URL, data);
        return response.data;
    }

    static async submitCycle(cycleId: string, submittedFileId: string): Promise<FeedbackCycle> {
        const response = await api.post<{ cycle: FeedbackCycle }>(`${this.BASE_URL}/cycle/${cycleId}/submit`, {
            submittedFileId,
        });
        return response.data.cycle;
    }

    static async approveCycle(cycleId: string): Promise<FeedbackCycle> {
        const response = await api.post<{ cycle: FeedbackCycle }>(`${this.BASE_URL}/cycle/${cycleId}/approve`, {});
        return response.data.cycle;
    }

    static async rejectCycle(cycleId: string): Promise<FeedbackCycle> {
        const response = await api.post<{ cycle: FeedbackCycle }>(`${this.BASE_URL}/cycle/${cycleId}/reject`, {});
        return response.data.cycle;
    }
}
