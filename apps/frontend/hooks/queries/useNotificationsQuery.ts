import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { NotificationsService, Notification } from '@/services/notifications.service';
import { queryKeys } from '@/lib/query-keys';
import { toast } from '@/lib/toast';

/**
 * Query hook for fetching notifications
 */
export function useNotificationsQuery(options?: { enabled?: boolean; refetchInterval?: number }) {
  return useQuery({
    queryKey: queryKeys.notifications.list(),
    queryFn: () => NotificationsService.getAll(),
    enabled: options?.enabled ?? true,
    staleTime: 30 * 1000,
    refetchInterval: options?.refetchInterval,
  });
}

/**
 * Mutation hook for marking a notification as read
 */
export function useMarkNotificationReadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) => NotificationsService.markAsRead(notificationId),
    onMutate: async (notificationId) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.list() });

      const previousNotifications = queryClient.getQueryData(queryKeys.notifications.list());

      queryClient.setQueryData(queryKeys.notifications.list(), (old: Notification[] | undefined) =>
        old?.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      );

      return { previousNotifications };
    },
    onError: (_, __, context) => {
      // Rollback on error
      if (context?.previousNotifications) {
        queryClient.setQueryData(queryKeys.notifications.list(), context.previousNotifications);
      }
      toast.error('Failed to mark notification as read');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.list() });
    },
  });
}

/**
 * Mutation hook for marking all notifications as read
 */
export function useMarkAllNotificationsReadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => NotificationsService.markAllAsRead(),
    onMutate: async () => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.list() });

      const previousNotifications = queryClient.getQueryData(queryKeys.notifications.list());

      queryClient.setQueryData(queryKeys.notifications.list(), (old: Notification[] | undefined) =>
        old?.map((n) => ({ ...n, isRead: true }))
      );

      return { previousNotifications };
    },
    onError: (_, __, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(queryKeys.notifications.list(), context.previousNotifications);
      }
      toast.error('Failed to mark notifications as read');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.list() });
    },
  });
}