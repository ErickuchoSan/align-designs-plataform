import React, { useCallback } from 'react';
import { Project } from '@/types';
import { formatDate } from '@/lib/utils/date.utils';
import { ProjectStatusBadge } from '../projects/ProjectStatusBadge';

interface ProjectCardProps {
  project: Project;
  isAdmin: boolean;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
  onClick?: (project: Project) => void;
}

function ProjectCard({
  project,
  isAdmin,
  onEdit,
  onDelete,
  onClick,
}: Readonly<ProjectCardProps>) {
  const handleCardClick = useCallback(() => {
    if (onClick) onClick(project);
  }, [onClick, project]);

  const handleEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(project);
  }, [onEdit, project]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(project);
  }, [onDelete, project]);

  const cardContent = (
    <div className="p-6">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-[#1B1C1A] truncate">{project.name}</h3>
          {project.status && (
            <div className="mt-2">
              <ProjectStatusBadge status={project.status} />
            </div>
          )}
        </div>
        {isAdmin && (
          <div className="flex gap-1 ml-3 flex-shrink-0">
            <button
              onClick={handleEdit}
              className="p-1.5 text-[#6B6A65] hover:text-[#1B1C1A] hover:bg-[#F5F4F0] rounded-lg transition-colors"
              aria-label={`Edit project ${project.name}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={handleDelete}
              className="p-1.5 text-[#6B6A65] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              aria-label={`Delete project ${project.name}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {project.description && (
        <p className="mt-2 text-sm text-[#6B6A65] line-clamp-2">{project.description}</p>
      )}

      {project.client && (
        <div className="mt-4 flex items-center gap-2.5">
          <div className="w-7 h-7 bg-gradient-to-br from-[#755B00] to-[#C9A84C] rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
            {project.client.firstName[0]}{project.client.lastName[0]}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-[#1B1C1A] truncate">
              {project.client.firstName} {project.client.lastName}
            </p>
            <p className="text-xs text-[#6B6A65] truncate">{project.client.email}</p>
          </div>
        </div>
      )}

      {project._count && (
        <div className="mt-4 pt-3 border-t border-[#D0C5B2]/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs text-[#6B6A65]">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              {project._count.files} file{project._count.files === 1 ? '' : 's'}
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-[#6B6A65]">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              {project._count.comments} comment{project._count.comments === 1 ? '' : 's'}
            </span>
          </div>
          <p className="text-xs text-[#6B6A65]">{formatDate(project.createdAt)}</p>
        </div>
      )}
    </div>
  );

  if (onClick) {
    return (
      <article className="bg-white rounded-xl hover:bg-[#F5F4F0] transition-colors cursor-pointer shadow-none hover:shadow-sm">
        <button
          type="button"
          onClick={handleCardClick}
          className="w-full text-left focus:outline-none focus:ring-2 focus:ring-[#C9A84C] focus:ring-offset-2 rounded-xl"
          aria-label={`View project ${project.name}`}
        >
          {cardContent}
        </button>
      </article>
    );
  }

  return (
    <article className="bg-white rounded-xl transition-colors">
      {cardContent}
    </article>
  );
}

export default React.memo(ProjectCard, (prevProps, nextProps) => {
  return (
    prevProps.project.id === nextProps.project.id &&
    prevProps.project.name === nextProps.project.name &&
    prevProps.project.description === nextProps.project.description &&
    prevProps.project._count?.files === nextProps.project._count?.files &&
    prevProps.project._count?.comments === nextProps.project._count?.comments &&
    prevProps.isAdmin === nextProps.isAdmin
  );
});
