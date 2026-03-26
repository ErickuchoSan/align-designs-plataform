import { useState, useMemo } from 'react';
import { Notification } from '@/services/notifications.service';
import {
  useNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} from './queries';

export type { Notification } from '@/services/notifications.service';

export function useNotifications() {
  const [isOpen, setIsOpen] = useState(false);

  // TanStack Query with conditional polling when drawer is open
  const {
    data: notifications = [],
    isLoading,
    refetch,
  } = useNotificationsQuery({
    enabled: true,
    refetchInterval: isOpen ? 30000 : undefined, // Poll every 30s only when open
  });

  // Calculate unread count from notifications
  const unreadCount = useMemo(
    () => notifications.filter((n: Notification) => !n.isRead).length,
    [notifications]
  );

  // Mutations with optimistic updates
  const markReadMutation = useMarkNotificationReadMutation();
  const markAllReadMutation = useMarkAllNotificationsReadMutation();

  const markAsRead = async (id: string) => {
    markReadMutation.mutate(id);
  };

  const markAllAsRead = async () => {
    markAllReadMutation.mutate();
  };

  return {
    notifications,
    unreadCount,
    loading: isLoading,
    isOpen,
    setIsOpen,
    markAsRead,
    markAllAsRead,
    refresh: refetch,
  };
}