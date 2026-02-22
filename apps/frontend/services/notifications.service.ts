import api from '@/lib/api';

export interface Notification {
    id: string;
    type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
    title: string;
    message: string;
    link?: string;
    isRead: boolean;
    createdAt: string;
}

export class NotificationsService {
    private static readonly BASE_URL = '/notifications';

    /**
     * Get all notifications for the current user
     */
    static async getAll(): Promise<Notification[]> {
        const response = await api.get<Notification[]>(this.BASE_URL);
        return response.data;
    }

    /**
     * Mark a notification as read
     */
    static async markAsRead(id: string): Promise<void> {
        await api.put(`${this.BASE_URL}/${id}/read`);
    }

    /**
     * Mark all notifications as read
     */
    static async markAllAsRead(): Promise<void> {
        await api.put(`${this.BASE_URL}/read-all`);
    }
}
