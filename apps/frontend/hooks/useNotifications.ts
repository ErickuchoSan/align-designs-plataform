import { useState, useEffect, useCallback } from 'react';
import { NotificationsService, Notification } from '@/services/notifications.service';

export type { Notification } from '@/services/notifications.service';

export function useNotifications() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);

    const fetchNotifications = useCallback(async () => {
        try {
            const loadedNotifications = await NotificationsService.getAll();
            setNotifications(loadedNotifications);

            // Calculate unread count directly from the list to ensure sync
            const count = loadedNotifications.filter((n) => !n.isRead).length;
            setUnreadCount(count);
        } catch {
            // Silent error - notifications are non-critical
        } finally {
            setLoading(false);
        }
    }, []);

    const markAsRead = async (id: string) => {
        try {
            await NotificationsService.markAsRead(id);
            setNotifications(prev =>
                prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch {
            // Silent error - marking as read is non-critical
        }
    };

    const markAllAsRead = async () => {
        try {
            await NotificationsService.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch {
            // Silent error - marking as read is non-critical
        }
    };

    // Initial fetch on mount
    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    // Polling effect - only poll when drawer is open
    useEffect(() => {
        if (!isOpen) return; // Don't poll when drawer is closed

        // Poll every 30 seconds when drawer is open
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [isOpen, fetchNotifications]);

    return {
        notifications,
        unreadCount,
        loading,
        isOpen,
        setIsOpen,
        markAsRead,
        markAllAsRead,
        refresh: fetchNotifications,
    };
}
