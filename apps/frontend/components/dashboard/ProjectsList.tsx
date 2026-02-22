import { Project } from '@/types';
import { ProjectCardSkeleton } from '@/components/ui/Loader';
import ProjectCard from './ProjectCard';
import ProjectModals from './ProjectModals';
import Pagination from '@/components/ui/Pagination';
import { useProjects } from '@/hooks/useProjects';
import { CheckIcon, CloseIcon } from '@/components/ui/icons';
import { PROJECT_THEMES, type ProjectTheme } from '@/lib/styles';

interface ProjectsListProps {
  isAuthenticated: boolean;
  userRole?: string;
  onProjectClick?: (project: Project) => void;
  theme?: ProjectTheme;
  showCreateButton?: boolean;
  showUsersButton?: boolean;
}

export default function ProjectsList({
  isAuthenticated,
  userRole,
  onProjectClick,
  theme = 'navy',
  showCreateButton = true,
  showUsersButton = false,
}: ProjectsListProps) {
  const projectsHook = useProjects(isAuthenticated, userRole);
  const isAdmin = userRole === 'ADMIN';

  const styles = PROJECT_THEMES[theme];

  return (
    <>
      {/* Success message */}
      {projectsHook.success && (
        <div className={`mb-6 rounded-lg ${styles.successBg} border ${styles.successBorder} p-4 shadow-sm animate-slideDown`} role="alert">
          <div className="flex items-center">
            <CheckIcon className={`${styles.successIcon} mr-3`} size="md" aria-hidden="true" />
            <p className={`text-sm font-medium ${styles.successText}`}>{projectsHook.success}</p>
          </div>
        </div>
      )}

      {/* Error message */}
      {projectsHook.error && (
        <div className={`mb-6 rounded-lg ${styles.errorBg} border ${styles.errorBorder} p-4 shadow-sm animate-slideDown`} role="alert">
          <div className="flex items-center">
            <CloseIcon className={`${styles.errorIcon} mr-3`} size="md" aria-hidden="true" />
            <p className={`text-sm font-medium ${styles.errorText}`}>{projectsHook.error}</p>
          </div>
        </div>
      )}

      {/* Create button and Users button (admin only) */}
      {isAdmin && (showCreateButton || showUsersButton) && (
        <div className="mb-6 flex justify-between items-center animate-slideDown">
          {showCreateButton && <h2 className={`text-2xl font-bold ${styles.title}`}>Projects</h2>}
          <div className="flex gap-3 ml-auto">
            {showUsersButton && (
              <a
                href="/dashboard/admin/users"
                className={`flex items-center gap-2 rounded-lg ${styles.secondaryButton} px-5 py-2.5 text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Users
              </a>
            )}
            {showCreateButton && (
              <button
                onClick={projectsHook.openCreateModal}
                className={`flex items-center gap-2 rounded-lg ${styles.primaryButton} px-5 py-2.5 text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500 ${theme === 'blue' ? 'hover:scale-105' : ''}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Project
              </button>
            )}
          </div>
        </div>
      )}

      {/* Projects grid */}
      {projectsHook.loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <ProjectCardSkeleton key={i} />
          ))}
        </div>
      ) : projectsHook.projects.length === 0 ? (
        <div className={`rounded-2xl bg-white p-12 text-center shadow-lg ${styles.cardBorder} animate-fadeIn`}>
          <div className={`mx-auto w-16 h-16 ${styles.emptyIcon} rounded-full flex items-center justify-center mb-4`} aria-hidden="true">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <p className={`text-lg ${styles.emptyTitle} font-medium`}>No projects available</p>
          {isAdmin && (
            <p className={`text-sm ${styles.emptyText} mt-2`}>Create your first project to get started</p>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 animate-fadeIn">
            {projectsHook.projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                isAdmin={isAdmin}
                onEdit={projectsHook.openEditConfirm}
                onDelete={projectsHook.openDeleteConfirm}
                onClick={onProjectClick}
                theme={theme}
              />
            ))}
          </div>

          {/* Pagination */}
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
          employees: projectsHook.employees, // Phase 1: Pass employees
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
        theme={theme}
      />
    </>
  );
}
