import { useQuery } from '@tanstack/react-query';
import { TrackingService } from '@/services/tracking.service';
import { queryKeys } from '@/lib/query-keys';

/**
 * Query hook for fetching project tracking stats
 */
export function useProjectTrackingStatsQuery(
  projectId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.tracking.projectStats(projectId),
    queryFn: () => TrackingService.getProjectStats(projectId),
    enabled: (options?.enabled ?? true) && !!projectId,
    staleTime: 60 * 1000, // 1 minute - stats don't change often
  });
}
