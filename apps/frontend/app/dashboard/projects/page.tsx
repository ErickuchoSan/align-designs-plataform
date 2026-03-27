'use client';

import { PageLoader } from '@/components/ui/Loader';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import ProjectsList from '@/components/dashboard/ProjectsList';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';

export default function ProjectsPage() {
  const { user, isAuthenticated, loading } = useProtectedRoute();

  if (loading || !user) {
    return <PageLoader text="Loading..." />;
  }

  return (
    <div className="flex flex-col h-full">
      <DashboardHeader title="Projects" showBackButton backUrl="/dashboard" />

      <div className="flex-1 px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <ProjectsList
            isAuthenticated={isAuthenticated}
            userRole={user.role}
  
            showCreateButton={true}
            showUsersButton={false}
          />
        </div>
      </div>
    </div>
  );
}
