'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { PageLoader } from '@/app/components/Loader';
import DashboardHeader from '@/app/components/DashboardHeader';
import ProjectsList from '@/components/dashboard/ProjectsList';
import { Project } from '@/types';

export default function DashboardPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  if (authLoading || !user) {
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
