'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { PageLoader } from '@/app/components/Loader';
import DashboardHeader from '@/app/components/DashboardHeader';
import ProjectsList from '@/components/dashboard/ProjectsList';

export default function ProjectsPage() {
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
