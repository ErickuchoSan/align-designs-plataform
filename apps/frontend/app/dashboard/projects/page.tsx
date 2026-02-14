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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <DashboardHeader title="Projects" showBackButton backUrl="/dashboard" />

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <ProjectsList
          isAuthenticated={isAuthenticated}
          userRole={user.role}
          theme="blue"
          showCreateButton={true}
          showUsersButton={false}
        />
      </main>
    </div>
  );
}
