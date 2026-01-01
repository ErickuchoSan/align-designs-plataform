import api from '@/lib/api';

export interface FileData {
    id: string;
    filename: string;
    uploadedAt: string;
    approvedClientAt: string;
    uploader?: {
        id: string;
        firstName: string;
        lastName: string;
    };
}

export const FilesService = {
    async getPendingPaymentFiles(projectId: string, employeeId?: string): Promise<FileData[]> {
        const response = await api.get(`/files/project/${projectId}/pending-payment`, {
            params: { employeeId }
        });
        return response.data;
    }
};
