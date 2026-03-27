'use client';

import { useRouter } from 'next/navigation';
import { PageLoader } from '@/components/ui/Loader';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import ProjectsList from '@/components/dashboard/ProjectsList';
import { Project } from '@/types';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';

export default function DashboardPage() {
  const { user, isAuthenticated, loading } = useProtectedRoute();
  const router = useRouter();

  if (loading || !user) {
    return <PageLoader text="Loading..." />;
  }

  const handleProjectClick = (project: Project) => {
    router.push(`/dashboard/projects/${project.id}`);
  };

  return (
    <div className="flex flex-col h-full">
      <DashboardHeader title="Dashboard" />
      <div className="flex-1 px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <ProjectsList
            isAuthenticated={isAuthenticated}
            userRole={user.role}
            onProjectClick={handleProjectClick}
  
            showCreateButton={true}
            showUsersButton={true}
          />
        </div>
      </div>
    </div>
  );
}
