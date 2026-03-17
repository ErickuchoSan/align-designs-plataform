import React, { useCallback } from 'react';
import { Project } from '@/types';
import { formatDate } from '@/lib/utils/date.utils';
import { ProjectStatusBadge } from '../projects/ProjectStatusBadge';
import { PROJECT_THEMES, type ProjectTheme } from '@/lib/styles';

interface ProjectCardProps {
  project: Project;
  isAdmin: boolean;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
  onClick?: (project: Project) => void;
  theme?: ProjectTheme;
}

/**
 * Optimized ProjectCard component using React.memo
 * Prevents unnecessary re-renders when props haven't changed
 */
function ProjectCard({
  project,
  isAdmin,
  onEdit,
  onDelete,
  onClick,
  theme = 'navy',
}: Readonly<ProjectCardProps>) {
  const handleCardClick = useCallback(() => {
    if (onClick) {
      onClick(project);
    }
  }, [onClick, project]);

  const handleEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(project);
  }, [onEdit, project]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(project);
  }, [onDelete, project]);

  // Use centralized theme styles (SSOT)
  const styles = PROJECT_THEMES[theme];

  const cardContent = (
    <div className="p-6">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className={`text-xl font-bold ${styles.title}`}>
            {project.name}
          </h3>
          {/* Phase 1: Status badge */}
          {project.status && (
            <div className="mt-2">
              <ProjectStatusBadge status={project.status} />
            </div>
          )}
        </div>
        {isAdmin && (
          <div className="flex gap-2 ml-2">
            <button
              onClick={handleEdit}
              className={`p-2 ${styles.iconEditButton} rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500`}
              aria-label={`Edit project ${project.name}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={handleDelete}
              className={`p-2 ${styles.iconDeleteButton} rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500`}
              aria-label={`Delete project ${project.name}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {project.description && (
        <p className="mt-2 text-sm text-stone-700 line-clamp-2">
          {project.description}
        </p>
      )}

      {project.client && (
        <div className="mt-4 flex items-center gap-2 text-sm">
          <div className={`w-8 h-8 ${styles.avatar} rounded-full flex items-center justify-center font-semibold`}>
            {project.client.firstName[0]}{project.client.lastName[0]}
          </div>
          <div>
            <p className={`font-medium ${styles.title}`}>
              {project.client.firstName} {project.client.lastName}
            </p>
            <p className={`text-xs ${styles.subtitle}`}>{project.client.email}</p>
          </div>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-stone-200 flex items-center justify-between">
        {project._count && (
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${styles.badge} text-xs font-medium`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              {project._count.files} file{project._count.files === 1 ? '' : 's'}
            </span>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${styles.badge} text-xs font-medium`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              {project._count.comments} comment{project._count.comments === 1 ? '' : 's'}
            </span>
          </div>
        )}
        <p className={`text-xs ${styles.subtitle}`}>
          {formatDate(project.createdAt)}
        </p>
      </div>
    </div>
  );

  // When clickable, wrap in a button for proper accessibility
  if (onClick) {
    return (
      <article className={`overflow-hidden rounded-2xl ${styles.card} transition-all duration-300 hover:scale-105`}>
        <button
          type="button"
          onClick={handleCardClick}
          className="w-full text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2 rounded-2xl"
          aria-label={`View project ${project.name}`}
        >
          {cardContent}
        </button>
      </article>
    );
  }

  // Non-clickable card (static display)
  return (
    <article className={`overflow-hidden rounded-2xl ${styles.card} transition-all duration-300`}>
      {cardContent}
    </article>
  );
}

// Memoize component to prevent unnecessary re-renders
// Only re-renders when props actually change
export default React.memo(ProjectCard, (prevProps, nextProps) => {
  // Custom comparison function for better performance
  return (
    prevProps.project.id === nextProps.project.id &&
    prevProps.project.name === nextProps.project.name &&
    prevProps.project.description === nextProps.project.description &&
    prevProps.project._count?.files === nextProps.project._count?.files &&
    prevProps.project._count?.comments === nextProps.project._count?.comments &&
    prevProps.isAdmin === nextProps.isAdmin &&
    prevProps.theme === nextProps.theme
  );
});
