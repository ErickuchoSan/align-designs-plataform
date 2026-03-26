import { useQuery } from '@tanstack/react-query';
import { StagesService } from '@/services/stages.service';
import { queryKeys } from '@/lib/query-keys';

/**
 * Query hook for fetching project stages
 */
export function useProjectStagesQuery(
  projectId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.stages.byProject(projectId),
    queryFn: () => StagesService.getProjectStages(projectId),
    enabled: (options?.enabled ?? true) && !!projectId,
    staleTime: 30 * 1000,
  });
}