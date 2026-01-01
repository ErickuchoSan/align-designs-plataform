import { api } from '@/lib/api';

export interface ProjectTrackingStats {
    totalDurationDays: number;
    durationDays: number;
    durationHours: number;
    durationMinutes: number;
    totalCycles: number;
    averageCycleDuration: number;
    rejectionRate: number;
    totalRejections: number;
}

export const TrackingService = {
    /**
     * Get time tracking statistics for a project
     */
    async getProjectStats(projectId: string): Promise<ProjectTrackingStats> {
        const response = await api.get<ProjectTrackingStats>(`/tracking/project/${projectId}`);
        return response.data;
    },
};
