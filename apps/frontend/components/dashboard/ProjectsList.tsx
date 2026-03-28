'use client';

import { useState, useMemo } from 'react';
import { Project } from '@/types';
import { ProjectStatus, ServiceType, SERVICE_TYPE_LABELS, PROJECT_STATUS_LABELS } from '@/types/enums';
import { ProjectCardSkeleton } from '@/components/ui/Loader';
import ProjectCard from './ProjectCard';
import ProjectModals from './ProjectModals';
import Pagination from '@/components/ui/Pagination';
import { useProjects } from '@/hooks/useProjects';

interface ProjectsListProps {
  isAuthenticated: boolean;
  userRole?: string;
  onProjectClick?: (project: Project) => void;
  showCreateButton?: boolean;
  showUsersButton?: boolean;
}

type SortOption = 'newest' | 'deadline' | 'budget';

const STATUS_FILTERS: { label: string; value: ProjectStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: PROJECT_STATUS_LABELS[ProjectStatus.ACTIVE], value: ProjectStatus.ACTIVE },
  { label: PROJECT_STATUS_LABELS[ProjectStatus.WAITING_PAYMENT], value: ProjectStatus.WAITING_PAYMENT },
  { label: PROJECT_STATUS_LABELS[ProjectStatus.PAUSED], value: ProjectStatus.PAUSED },
  { label: PROJECT_STATUS_LABELS[ProjectStatus.COMPLETED], value: ProjectStatus.COMPLETED },
  { label: PROJECT_STATUS_LABELS[ProjectStatus.ARCHIVED], value: ProjectStatus.ARCHIVED },
];

const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: 'Newest', value: 'newest' },
  { label: 'Deadline', value: 'deadline' },
  { label: 'Budget ↓', value: 'budget' },
];

export default function ProjectsList({
  isAuthenticated,
  userRole,
  onProjectClick,
  showCreateButton = true,
  showUsersButton = false,
}: Readonly<ProjectsListProps>) {
  const projectsHook = useProjects(isAuthenticated, userRole);
  const isAdmin = userRole === 'ADMIN';

  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const [serviceFilter, setServiceFilter] = useState<ServiceType | 'all'>('all');
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  const today = useMemo(() => new Date(), []);

  const filteredProjects = useMemo(() => {
    let result = projectsHook.projects;

    if (statusFilter !== 'all') {
      result = result.filter(p => p.status === statusFilter);
    }
    if (serviceFilter !== 'all') {
      result = result.filter(p => p.serviceType === serviceFilter);
    }
    if (overdueOnly) {
      result = result.filter(p =>
        p.initialPaymentDeadline && new Date(p.initialPaymentDeadline) < today &&
        p.status !== ProjectStatus.COMPLETED && p.status !== ProjectStatus.ARCHIVED
      );
    }

    const copy = [...result];
    if (sortBy === 'newest') {
      copy.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === 'deadline') {
      copy.sort((a, b) => {
        if (!a.deadlineDate) return 1;
        if (!b.deadlineDate) return -1;
        return new Date(a.deadlineDate).getTime() - new Date(b.deadlineDate).getTime();
      });
    } else if (sortBy === 'budget') {
      copy.sort((a, b) => (Number(b.initialAmountRequired) || 0) - (Number(a.initialAmountRequired) || 0));
    }
    return copy;
  }, [projectsHook.projects, statusFilter, serviceFilter, overdueOnly, sortBy, today]);

  // Which service types are present in the loaded projects
  const availableServiceTypes = useMemo(() => {
    const types = new Set(projectsHook.projects.map(p => p.serviceType).filter(Boolean) as ServiceType[]);
    return Array.from(types);
  }, [projectsHook.projects]);

  const hasActiveFilters = statusFilter !== 'all' || serviceFilter !== 'all' || overdueOnly;

  return (
    <>
      {projectsHook.success && (
        <div className="mb-6 rounded-lg bg-[#D1E7DD] p-4 animate-slideDown" role="alert">
          <p className="text-sm font-medium text-[#2D6A4F]">{projectsHook.success}</p>
        </div>
      )}
      {projectsHook.error && (
        <div className="mb-6 rounded-lg bg-[#FFDAD6]/50 p-4 animate-slideDown" role="alert">
          <p className="text-sm font-medium text-[#BA1A1A]">{projectsHook.error}</p>
        </div>
      )}

      {/* ── Toolbar ── */}
      <div className="mb-6 flex flex-col gap-3">
        {/* Row 1: Status filter pills + actions */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {/* Status tabs */}
          <div className="flex items-center gap-1 bg-[#EFEEE9] p-1 rounded-xl overflow-x-auto">
            {STATUS_FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`flex-shrink-0 px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  statusFilter === f.value
                    ? 'bg-white text-[#1B1C1A] shadow-sm'
                    : 'text-[#6B6A65] hover:text-[#1B1C1A]'
                }`}
              >
                {f.label}
                {f.value !== 'all' && (
                  <span className="ml-1.5 text-[10px] opacity-60">
                    ({projectsHook.projects.filter(p => p.status === f.value).length})
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Right: sort + create */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as SortOption)}
              className="text-xs font-medium bg-white border border-[#E2E1DC] rounded-lg px-3 py-1.5 text-[#1B1C1A] appearance-none cursor-pointer pr-6"
              style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%236B6A65\' stroke-width=\'2\'%3E%3Cpath d=\'M6 9l6 6 6-6\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center' }}
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>

            {isAdmin && showCreateButton && (
              <button
                onClick={projectsHook.openCreateModal}
                className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-br from-[#755B00] to-[#C9A84C] text-white text-sm font-semibold hover:brightness-95 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Project
              </button>
            )}
            {isAdmin && showCreateButton && (
              <button
                onClick={projectsHook.openCreateModal}
                className="md:hidden flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-[#755B00] to-[#C9A84C] text-white hover:brightness-95 transition-all"
                aria-label="New Project"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Category pills + overdue toggle */}
        {(availableServiceTypes.length > 0 || !projectsHook.loading) && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[#6B6A65] flex-shrink-0">Category</span>

            <button
              onClick={() => setServiceFilter('all')}
              className={`flex-shrink-0 px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
                serviceFilter === 'all'
                  ? 'bg-[#1B1C1A] text-white'
                  : 'bg-[#EFEEE9] text-[#6B6A65] hover:text-[#1B1C1A]'
              }`}
            >
              All
            </button>
            {availableServiceTypes.map(type => (
              <button
                key={type}
                onClick={() => setServiceFilter(serviceFilter === type ? 'all' : type)}
                className={`flex-shrink-0 px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
                  serviceFilter === type
                    ? 'bg-[#C9A84C] text-[#503D00]'
                    : 'bg-[#EFEEE9] text-[#6B6A65] hover:text-[#1B1C1A]'
                }`}
              >
                {SERVICE_TYPE_LABELS[type]}
              </button>
            ))}

            {/* Overdue toggle */}
            <div className="ml-auto flex-shrink-0">
              <button
                onClick={() => setOverdueOnly(!overdueOnly)}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
                  overdueOnly
                    ? 'bg-[#FFDAD6]/70 text-[#BA1A1A]'
                    : 'bg-[#EFEEE9] text-[#6B6A65] hover:text-[#1B1C1A]'
                }`}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Overdue Payment
              </button>
            </div>
          </div>
        )}

        {/* Active filter count */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#6B6A65]">
              Showing <span className="font-semibold text-[#1B1C1A]">{filteredProjects.length}</span> of {projectsHook.projects.length} projects
            </span>
            <button
              onClick={() => { setStatusFilter('all'); setServiceFilter('all'); setOverdueOnly(false); }}
              className="text-xs text-[#C9A84C] hover:text-[#755B00] font-semibold transition-colors"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* ── Loading skeleton ── */}
      {projectsHook.loading && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <ProjectCardSkeleton key={i} />)}
        </div>
      )}

      {/* ── Empty state ── */}
      {!projectsHook.loading && filteredProjects.length === 0 && (
        <div className="bg-white rounded-xl p-12 text-center">
          <div className="mx-auto w-14 h-14 bg-[#F5F4F0] text-[#6B6A65] rounded-full flex items-center justify-center mb-4">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <p className="text-base font-medium text-[#1B1C1A]">
            {hasActiveFilters ? 'No projects match the current filters' : 'No projects available'}
          </p>
          {hasActiveFilters ? (
            <button
              onClick={() => { setStatusFilter('all'); setServiceFilter('all'); setOverdueOnly(false); }}
              className="mt-4 text-sm text-[#C9A84C] hover:text-[#755B00] font-semibold"
            >
              Clear filters
            </button>
          ) : isAdmin && (
            <p className="text-sm text-[#6B6A65] mt-1">Create your first project to get started</p>
          )}
        </div>
      )}

      {/* ── Projects grid ── */}
      {!projectsHook.loading && filteredProjects.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                isAdmin={isAdmin}
                onEdit={projectsHook.openEditConfirm}
                onDelete={projectsHook.openDeleteConfirm}
                onClick={onProjectClick}
              />
            ))}
          </div>

          {!hasActiveFilters && projectsHook.totalPages > 0 && (
            <Pagination
              currentPage={projectsHook.currentPage}
              totalPages={projectsHook.totalPages}
              totalItems={projectsHook.totalItems}
              itemsPerPage={projectsHook.itemsPerPage}
              onPageChange={projectsHook.setCurrentPage}
              onItemsPerPageChange={projectsHook.setItemsPerPage}
            />
          )}
        </>
      )}

      {/* ── Modals ── */}
      <ProjectModals
        createModal={{
          isOpen: projectsHook.showCreateModal,
          onClose: projectsHook.closeCreateModal,
          formData: projectsHook.createFormData,
          onFormChange: projectsHook.setCreateFormData,
          onSubmit: projectsHook.handleCreateProject,
          isSubmitting: projectsHook.creating,
          clients: projectsHook.clients,
          employees: projectsHook.employees,
        }}
        editModal={{
          isConfirmOpen: projectsHook.showEditConfirm,
          onConfirmClose: (show: boolean) => { projectsHook.setShowEditConfirm(show); },
          isEditOpen: projectsHook.showEditModal,
          onEditClose: projectsHook.closeEditModal,
          project: projectsHook.editingProject,
          onProjectChange: projectsHook.setEditingProject,
          formData: projectsHook.editFormData,
          onFormChange: projectsHook.setEditFormData,
          onSubmit: projectsHook.handleEditProject,
          isSubmitting: projectsHook.editing,
          onConfirm: projectsHook.confirmEdit,
          canChangeClient: projectsHook.canChangeClient,
        }}
        deleteModal={{
          isOpen: projectsHook.showDeleteConfirm,
          onClose: (show: boolean) => { projectsHook.setShowDeleteConfirm(show); },
          project: projectsHook.projectToDelete,
          onProjectChange: projectsHook.setProjectToDelete,
          onConfirm: projectsHook.handleDeleteProject,
          isDeleting: projectsHook.deleting,
        }}
      />
    </>
  );
}
