'use client';

import { useParams } from 'next/navigation';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';
import { useProjectPayments } from './hooks/useProjectPayments';
import { ClientPaymentsView, AdminPaymentsView } from './components';

export default function ProjectPaymentsPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { user, isAdmin, loading: authLoading } = useProtectedRoute();

  const {
    payments,
    invoices,
    project,
    isLoading,
    pendingAmount,
    remainingAmount,
    isFullyCovered,
    loadData,
    handleViewInvoice,
  } = useProjectPayments(projectId);

  if (!projectId || authLoading) return null;

  const isClient = user?.role === 'CLIENT';

  return (
    <div className="flex flex-col h-full">
      <DashboardHeader
        title={`${isClient ? 'My Payments' : 'Payment History'} - ${project?.name || 'Project'}`}
        showBackButton
        backUrl={`/dashboard/projects/${projectId}`}
      />

      <main id="main-content" className="flex-1 px-6 py-8">
        <div className="max-w-7xl mx-auto">
        {isClient && (
          <ClientPaymentsView
            projectId={projectId}
            project={project}
            payments={payments}
            invoices={invoices}
            isLoading={isLoading}
            pendingAmount={pendingAmount}
            remainingAmount={remainingAmount}
            isFullyCovered={isFullyCovered}
            onViewInvoice={handleViewInvoice}
            onRefresh={loadData}
          />
        )}

        {isAdmin && (
          <AdminPaymentsView
            projectId={projectId}
            project={project}
            payments={payments}
            invoices={invoices}
            isLoading={isLoading}
            remainingAmount={remainingAmount}
            onViewInvoice={handleViewInvoice}
            onRefresh={loadData}
          />
        )}
        </div>
      </main>
    </div>
  );
}
