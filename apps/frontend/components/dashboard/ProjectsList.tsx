import { Project } from '@/types';
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

export default function ProjectsList({
  isAuthenticated,
  userRole,
  onProjectClick,
  showCreateButton = true,
  showUsersButton = false,
}: Readonly<ProjectsListProps>) {
  const projectsHook = useProjects(isAuthenticated, userRole);
  const isAdmin = userRole === 'ADMIN';

  return (
    <>
      {/* Success message */}
      {projectsHook.success && (
        <div className="mb-6 rounded-lg bg-[#D1E7DD] p-4 animate-slideDown" role="alert">
          <p className="text-sm font-medium text-[#2D6A4F]">{projectsHook.success}</p>
        </div>
      )}

      {/* Error message */}
      {projectsHook.error && (
        <div className="mb-6 rounded-lg bg-[#FFDAD6]/50 p-4 animate-slideDown" role="alert">
          <p className="text-sm font-medium text-[#BA1A1A]">{projectsHook.error}</p>
        </div>
      )}

      {/* Header: title + actions (admin only) */}
      {isAdmin && (showCreateButton || showUsersButton) && (
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#1B1C1A]">Projects</h2>
          <div className="flex gap-3">
            {showUsersButton && (
              <a
                href="/dashboard/admin/users"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#E3E2DF] text-[#1B1C1A] text-sm font-medium hover:bg-[#D9D8D5] transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Users
              </a>
            )}
            {showCreateButton && (
              <button
                onClick={projectsHook.openCreateModal}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-br from-[#755B00] to-[#C9A84C] text-white text-sm font-semibold hover:brightness-95 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Project
              </button>
            )}
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {projectsHook.loading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <ProjectCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!projectsHook.loading && projectsHook.projects.length === 0 && (
        <div className="bg-white rounded-xl p-12 text-center">
          <div className="mx-auto w-14 h-14 bg-[#F5F4F0] text-[#6B6A65] rounded-full flex items-center justify-center mb-4" aria-hidden="true">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <p className="text-base font-medium text-[#1B1C1A]">No projects available</p>
          {isAdmin && (
            <p className="text-sm text-[#6B6A65] mt-1">Create your first project to get started</p>
          )}
        </div>
      )}

      {/* Projects grid */}
      {!projectsHook.loading && projectsHook.projects.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projectsHook.projects.map((project) => (
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

          {projectsHook.totalPages > 0 && (
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

      {/* Modals */}
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
          onConfirmClose: (show: boolean) => {
            projectsHook.setShowEditConfirm(show);
          },
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
          onClose: (show: boolean) => {
            projectsHook.setShowDeleteConfirm(show);
          },
          project: projectsHook.projectToDelete,
          onProjectChange: projectsHook.setProjectToDelete,
          onConfirm: projectsHook.handleDeleteProject,
          isDeleting: projectsHook.deleting,
        }}
      />
    </>
  );
}
