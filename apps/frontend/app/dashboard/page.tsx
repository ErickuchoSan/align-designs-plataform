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
    <div className="min-h-screen bg-stone-50">
      <DashboardHeader title="Dashboard" />

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <ProjectsList
          isAuthenticated={isAuthenticated}
          userRole={user.role}
          onProjectClick={handleProjectClick}
          theme="navy"
          showCreateButton={true}
          showUsersButton={true}
        />
      </main>
    </div>
  );
}
