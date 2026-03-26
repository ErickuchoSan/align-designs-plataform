import { useQuery } from '@tanstack/react-query';
import { UsersService } from '@/services/users.service';
import { InvoicesService } from '@/services/invoices.service';
import { ProjectsService } from '@/services/projects.service';
import { queryKeys } from '@/lib/query-keys';

/**
 * Query hook for fetching combined client profile data (user, invoices, projects)
 */
export function useClientProfileDataQuery(
  clientId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: [...queryKeys.users.detail(clientId), 'profile-data'],
    queryFn: async () => {
      const [client, invoices, projectsData] = await Promise.all([
        UsersService.getById(clientId),
        InvoicesService.getAll({ clientId }),
        ProjectsService.getAll({ clientId }),
      ]);

      // Handle different response formats from ProjectsService.getAll
      let projects: Awaited<ReturnType<typeof ProjectsService.getAll>>['projects'] = [];
      if ('projects' in projectsData && Array.isArray(projectsData.projects)) {
        projects = projectsData.projects;
      } else if (Array.isArray(projectsData)) {
        projects = projectsData as typeof projects;
      }

      return { client, invoices, projects };
    },
    enabled: (options?.enabled ?? true) && !!clientId,
    staleTime: 30 * 1000,
  });
}
