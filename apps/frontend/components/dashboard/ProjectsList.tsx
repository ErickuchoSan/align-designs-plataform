import { Project } from '@/types';
import { ProjectCardSkeleton } from '@/app/components/Loader';
import ProjectCard from './ProjectCard';
import ProjectModals from './ProjectModals';
import { useProjects } from '@/hooks/useProjects';

interface ProjectsListProps {
  isAuthenticated: boolean;
  userRole?: string;
  onProjectClick?: (project: Project) => void;
  theme?: 'navy' | 'blue';
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

  const themeStyles = {
    navy: {
      successBg: 'bg-forest-50',
      successBorder: 'border-forest-200',
      successIcon: 'text-forest-600',
      successText: 'text-forest-800',
      errorBg: 'bg-red-50',
      errorBorder: 'border-red-200',
      errorIcon: 'text-red-600',
      errorText: 'text-red-800',
      title: 'text-navy-900',
      usersButton: 'bg-steel-700 hover:bg-steel-600',
      createButton: 'bg-navy-800 hover:bg-navy-700',
      emptyIcon: 'bg-stone-100 text-stone-700',
      emptyTitle: 'text-navy-900',
      emptyText: 'text-stone-700',
    },
    blue: {
      successBg: 'bg-green-50',
      successBorder: 'border-green-200',
      successIcon: 'text-green-600',
      successText: 'text-green-800',
      errorBg: 'bg-red-50',
      errorBorder: 'border-red-200',
      errorIcon: 'text-red-600',
      errorText: 'text-red-800',
      title: 'text-gray-900',
      usersButton: 'bg-gradient-to-r from-purple-600 to-pink-600',
      createButton: 'bg-gradient-to-r from-blue-600 to-indigo-600',
      emptyIcon: 'bg-gray-100 text-gray-700',
      emptyTitle: 'text-gray-700',
      emptyText: 'text-gray-700',
    },
  };

  const styles = themeStyles[theme];

  return (
    <>
      {/* Success message */}
      {projectsHook.success && (
        <div className={`mb-6 rounded-lg ${styles.successBg} border ${styles.successBorder} p-4 shadow-sm animate-slideDown`}>
          <div className="flex items-center">
            <svg className={`w-5 h-5 ${styles.successIcon} mr-3`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className={`text-sm font-medium ${styles.successText}`}>{projectsHook.success}</p>
          </div>
        </div>
      )}

      {/* Error message */}
      {projectsHook.error && (
        <div className={`mb-6 rounded-lg ${styles.errorBg} border ${styles.errorBorder} p-4 shadow-sm animate-slideDown`}>
          <div className="flex items-center">
            <svg className={`w-5 h-5 ${styles.errorIcon} mr-3`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
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
                href="/dashboard/users"
                className={`flex items-center gap-2 rounded-lg ${styles.usersButton} px-5 py-2.5 text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-200`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Users
              </a>
            )}
            {showCreateButton && (
              <button
                onClick={() => projectsHook.setShowCreateModal(true)}
                className={`flex items-center gap-2 rounded-lg ${styles.createButton} px-5 py-2.5 text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-200 ${theme === 'blue' ? 'hover:scale-105' : ''}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <div className={`rounded-2xl bg-white p-12 text-center shadow-lg ${theme === 'navy' ? 'border border-stone-200' : ''} animate-fadeIn`}>
          <div className={`mx-auto w-16 h-16 ${styles.emptyIcon} rounded-full flex items-center justify-center mb-4`}>
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
      )}

      {/* Modals */}
      <ProjectModals
        showCreateModal={projectsHook.showCreateModal}
        closeCreateModal={projectsHook.closeCreateModal}
        createFormData={projectsHook.createFormData}
        setCreateFormData={projectsHook.setCreateFormData}
        handleCreateProject={projectsHook.handleCreateProject}
        creating={projectsHook.creating}
        clients={projectsHook.clients}
        showEditConfirm={projectsHook.showEditConfirm}
        setShowEditConfirm={projectsHook.setShowEditConfirm}
        showEditModal={projectsHook.showEditModal}
        closeEditModal={projectsHook.closeEditModal}
        editingProject={projectsHook.editingProject}
        setEditingProject={projectsHook.setEditingProject}
        editFormData={projectsHook.editFormData}
        setEditFormData={projectsHook.setEditFormData}
        handleEditProject={projectsHook.handleEditProject}
        editing={projectsHook.editing}
        confirmEdit={projectsHook.confirmEdit}
        showDeleteConfirm={projectsHook.showDeleteConfirm}
        setShowDeleteConfirm={projectsHook.setShowDeleteConfirm}
        projectToDelete={projectsHook.projectToDelete}
        setProjectToDelete={projectsHook.setProjectToDelete}
        handleDeleteProject={projectsHook.handleDeleteProject}
        deleting={projectsHook.deleting}
        theme={theme}
      />
    </>
  );
}
