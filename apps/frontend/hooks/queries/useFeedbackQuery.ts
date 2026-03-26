import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FeedbackService } from '@/services/feedback.service';
import { queryKeys } from '@/lib/query-keys';

/**
 * Query hook for fetching project feedback cycles
 */
export function useProjectFeedbackCyclesQuery(
  projectId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.feedback.cycles(projectId),
    queryFn: () => FeedbackService.getProjectCycles(projectId),
    enabled: (options?.enabled ?? true) && !!projectId,
    staleTime: 30 * 1000,
  });
}

/**
 * Hook for refreshing feedback cycles (silent refresh without loading state)
 */
export function useFeedbackCyclesRefresh(projectId: string) {
  const queryClient = useQueryClient();

  return async () => {
    await queryClient.invalidateQueries({
      queryKey: queryKeys.feedback.cycles(projectId),
    });
  };
}
