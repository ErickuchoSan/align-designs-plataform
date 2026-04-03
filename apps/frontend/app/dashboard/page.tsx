'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageLoader } from '@/components/ui/Loader';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import ProjectCard from '@/components/dashboard/ProjectCard';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';
import { useProjectsListQuery } from '@/hooks/queries/useProjectsQuery';
import { useInvoicesListQuery } from '@/hooks/queries/useInvoicesQuery';
import { ProjectStatus, InvoiceStatus, Role } from '@/types/enums';
import { Project } from '@/types';

// ── Icons ────────────────────────────────────────────────────────────────────
const FolderIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
  </svg>
);
const CheckIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const ClockIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);
const ReceiptIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
  </svg>
);
const PlusIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const UsersIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
  </svg>
);
const ArrowRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
);

// ── Stat Card ─────────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  accent?: string;
  loading?: boolean;
}

function StatCard({ label, value, icon, accent = '#C9A84C', loading }: Readonly<StatCardProps>) {
  return (
    <div className="bg-white rounded-xl p-6 flex items-start gap-4">
      <div
        className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${accent}15`, color: accent }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#6B6A65]">{label}</p>
        {loading ? (
          <div className="mt-1.5 h-7 w-12 bg-[#E9E8E4] animate-pulse rounded" />
        ) : (
          <p className="text-3xl font-bold text-[#1B1C1A] mt-0.5">{value}</p>
        )}
      </div>
    </div>
  );
}

// ── Quick Action ──────────────────────────────────────────────────────────────
function QuickAction({ href, icon, label, description }: Readonly<{ href: string; icon: React.ReactNode; label: string; description: string }>) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 p-4 rounded-xl hover:bg-[#F5F4F0] transition-colors group"
    >
      <div className="w-10 h-10 rounded-lg bg-[#F5F4F0] group-hover:bg-[#E9E8E4] flex items-center justify-center text-[#6B6A65] group-hover:text-[#1B1C1A] transition-colors flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#1B1C1A]">{label}</p>
        <p className="text-xs text-[#6B6A65] truncate">{description}</p>
      </div>
      <span className="text-[#D0C5B2] group-hover:text-[#C9A84C] transition-colors flex-shrink-0">
        <ArrowRightIcon />
      </span>
    </Link>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user, loading } = useProtectedRoute();
  const router = useRouter();
  const isAdmin = user?.role === Role.ADMIN;
  const isEmployee = user?.role === Role.EMPLOYEE;

  // Fetch all projects to compute stats
  const { data: allProjectsData, isLoading: projectsLoading } = useProjectsListQuery(
    { limit: 100 },
    { enabled: !!user }
  );

  // Fetch recent projects (5 most recent)
  const { data: recentData, isLoading: recentLoading } = useProjectsListQuery(
    { limit: 5 },
    { enabled: !!user }
  );

  // Fetch invoices for admin stats
  const { data: invoicesData, isLoading: invoicesLoading } = useInvoicesListQuery(
    undefined,
    { enabled: !!user && isAdmin }
  );

  if (loading || !user) return <PageLoader text="Loading..." />;

  const projects = allProjectsData?.projects ?? [];
  const recentProjects = recentData?.projects ?? [];

  // Compute stats client-side
  const activeCount = projects.filter((p: Project) => p.status === ProjectStatus.ACTIVE).length;
  const completedCount = projects.filter((p: Project) => p.status === ProjectStatus.COMPLETED).length;
  const waitingCount = projects.filter((p: Project) => p.status === ProjectStatus.WAITING_PAYMENT).length;
  const totalCount = allProjectsData?.total ?? 0;

  const pendingInvoices = (invoicesData ?? []).filter(
    (inv) => inv.status === InvoiceStatus.SENT || inv.status === InvoiceStatus.OVERDUE
  ).length;

  const handleProjectClick = (project: Project) => {
    router.push(`/dashboard/projects/${project.id}`);
  };

  return (
    <div className="flex flex-col h-full">
      <DashboardHeader title="Dashboard" />

      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-7xl mx-auto space-y-8">

          {/* ── Greeting ── */}
          <div>
            <h2 className="text-2xl font-bold text-[#1B1C1A] tracking-tight">
              Good {getGreeting()}, {user.firstName}
            </h2>
            <p className="text-sm text-[#6B6A65] mt-1">
              {(() => {
                if (isAdmin) return "Here's an overview of your studio.";
                if (isEmployee) return "Here are your assigned projects.";
                return "Here's the status of your projects.";
              })()}
            </p>
          </div>

          {/* ── Stat cards ── */}
          <div className={`grid gap-4 ${isAdmin ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-2 lg:grid-cols-3'}`}>
            <StatCard
              label={isEmployee ? 'Assigned' : 'Active'}
              value={activeCount}
              icon={<FolderIcon />}
              accent="#C9A84C"
              loading={projectsLoading}
            />
            <StatCard
              label="Completed"
              value={completedCount}
              icon={<CheckIcon />}
              accent="#2D6A4F"
              loading={projectsLoading}
            />
            {isAdmin ? (
              <>
                <StatCard
                  label="Awaiting payment"
                  value={waitingCount}
                  icon={<ClockIcon />}
                  accent="#755B00"
                  loading={projectsLoading}
                />
                <StatCard
                  label="Pending invoices"
                  value={pendingInvoices}
                  icon={<ReceiptIcon />}
                  accent="#BA1A1A"
                  loading={invoicesLoading}
                />
              </>
            ) : (
              <StatCard
                label="Total"
                value={totalCount}
                icon={<FolderIcon />}
                accent="#515E7E"
                loading={projectsLoading}
              />
            )}
          </div>

          {/* ── Main content: recent projects + quick actions ── */}
          <div className={`gap-6 ${isAdmin ? 'lg:grid lg:grid-cols-3' : ''}`}>

            {/* Recent projects */}
            <div className={isAdmin ? 'lg:col-span-2 space-y-4' : 'space-y-4'}>
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[#1B1C1A]">Recent projects</h3>
                <Link
                  href="/dashboard/projects"
                  className="text-sm font-semibold text-[#755B00] hover:text-[#C9A84C] transition-colors flex items-center gap-1"
                >
                  View all <ArrowRightIcon />
                </Link>
              </div>

              {recentLoading && (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white rounded-xl h-28 animate-pulse" />
                  ))}
                </div>
              )}

              {!recentLoading && recentProjects.length === 0 && (
                <div className="bg-white rounded-xl p-10 text-center">
                  <p className="text-sm text-[#6B6A65]">No projects yet.</p>
                  {isAdmin && (
                    <button
                      onClick={() => router.push('/dashboard/projects')}
                      className="mt-3 text-sm font-semibold text-[#755B00] hover:text-[#C9A84C] transition-colors"
                    >
                      Create your first project →
                    </button>
                  )}
                </div>
              )}

              {!recentLoading && recentProjects.length > 0 && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {recentProjects.map((project: Project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      isAdmin={isAdmin}
                      onEdit={() => router.push('/dashboard/projects')}
                      onDelete={() => router.push('/dashboard/projects')}
                      onClick={handleProjectClick}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Quick actions — admin only */}
            {isAdmin && (
              <div className="mt-6 lg:mt-0 space-y-4">
                <h3 className="text-base font-bold text-[#1B1C1A]">Quick actions</h3>
                <div className="bg-white rounded-xl overflow-hidden divide-y divide-[#D0C5B2]/15">
                  <QuickAction
                    href="/dashboard/projects"
                    icon={<PlusIcon />}
                    label="New project"
                    description="Create a project for a client"
                  />
                  <QuickAction
                    href="/dashboard/admin/invoices/new"
                    icon={<ReceiptIcon />}
                    label="New invoice"
                    description="Bill a client for services"
                  />
                  <QuickAction
                    href="/dashboard/admin/clients"
                    icon={<UsersIcon />}
                    label="Clients"
                    description="Manage client accounts"
                  />
                  <QuickAction
                    href="/dashboard/admin/users"
                    icon={<UsersIcon />}
                    label="Team"
                    description="Manage employees & access"
                  />
                  <QuickAction
                    href="/dashboard/admin/invoices"
                    icon={<ReceiptIcon />}
                    label="All invoices"
                    description="View and track payments"
                  />
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 18) return 'afternoon';
  return 'evening';
}