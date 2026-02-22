import api from '@/lib/api';
import { File as FileEntity, FileFilters } from '@/types';

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

interface PaginatedFiles {
    data: FileEntity[];
    meta: {
        total: number;
        totalPages: number;
    };
}

interface UploadOptions {
    /** Browser File object to upload */
    file: globalThis.File;
    comment?: string;
    stage?: string;
    relatedFileId?: string;
    onUploadProgress?: (progressEvent: { loaded: number; total?: number }) => void;
}

export class FilesService {
    private static readonly BASE_URL = '/files';

    /**
     * Get files for a project with pagination and filters
     */
    static async getProjectFiles(
        projectId: string,
        params: Partial<FileFilters> = {}
    ): Promise<PaginatedFiles> {
        const response = await api.get<PaginatedFiles>(`${this.BASE_URL}/project/${projectId}`, {
            params,
        });
        return response.data;
    }

    /**
     * Get available file types for a project (for filter dropdown)
     */
    static async getProjectFileTypes(projectId: string): Promise<string[]> {
        const response = await api.get<string[]>(`${this.BASE_URL}/project/${projectId}/types`);
        return response.data;
    }

    /**
     * Upload a file to a project
     */
    static async upload(
        projectId: string,
        options: UploadOptions
    ): Promise<void> {
        const formData = new FormData();
        formData.append('file', options.file);
        if (options.comment) formData.append('comment', options.comment);
        if (options.stage) formData.append('stage', options.stage);
        if (options.relatedFileId) formData.append('relatedFileId', options.relatedFileId);

        await api.post(`${this.BASE_URL}/${projectId}/upload`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: options.onUploadProgress,
        });
    }

    /**
     * Create a text-only comment (no file)
     */
    static async createComment(
        projectId: string,
        comment: string,
        stage?: string,
        relatedFileId?: string
    ): Promise<void> {
        await api.post(`${this.BASE_URL}/${projectId}/comment`, {
            comment,
            stage,
            relatedFileId,
        });
    }

    /**
     * Update a file (comment and/or replace file content)
     */
    static async update(
        fileId: string,
        options: { comment?: string; file?: globalThis.File }
    ): Promise<void> {
        const formData = new FormData();
        if (options.comment !== undefined) formData.append('comment', options.comment);
        if (options.file) formData.append('file', options.file);

        await api.patch(`${this.BASE_URL}/${fileId}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    }

    /**
     * Get download URL for a file
     */
    static async getDownloadUrl(fileId: string): Promise<string> {
        const response = await api.get<{ downloadUrl: string }>(`${this.BASE_URL}/${fileId}/download`);
        return response.data.downloadUrl;
    }

    /**
     * Delete a file
     */
    static async delete(fileId: string): Promise<void> {
        await api.delete(`${this.BASE_URL}/${fileId}`);
    }

    /**
     * Get files pending payment for a project
     */
    static async getPendingPaymentFiles(projectId: string, employeeId?: string): Promise<FileData[]> {
        const response = await api.get(`${this.BASE_URL}/project/${projectId}/pending-payment`, {
            params: { employeeId },
        });
        return response.data;
    }
}
