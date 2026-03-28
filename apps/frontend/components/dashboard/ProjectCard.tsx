import React, { useCallback } from 'react';
import Image from 'next/image';
import { Project } from '@/types';
import { ProjectStatus, ServiceType, SERVICE_TYPE_IMAGES, SERVICE_TYPE_LABELS, PROJECT_STATUS_LABELS, SERVICE_TYPE_COLORS } from '@/types/enums';
import { formatDate } from '@/lib/utils/date.utils';
import { formatCurrency } from '@/lib/utils/currency.utils';

interface ProjectCardProps {
  project: Project;
  isAdmin: boolean;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
  onClick?: (project: Project) => void;
}

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=600&q=80&fit=crop&auto=format';

const STATUS_BADGE: Record<ProjectStatus, string> = {
  [ProjectStatus.ACTIVE]:          'bg-[#C9A84C] text-[#503D00]',
  [ProjectStatus.WAITING_PAYMENT]: 'bg-[#FFF3CD] text-[#856404]',
  [ProjectStatus.PAUSED]:          'bg-[#FFDAD6]/60 text-[#BA1A1A]',
  [ProjectStatus.COMPLETED]:       'bg-[#D1E7DD] text-[#2D6A4F]',
  [ProjectStatus.ARCHIVED]:        'bg-[#E5E2DE] text-[#656461]',
};

// Progress % based on status (visual approximation)
const STATUS_PROGRESS: Record<ProjectStatus, number> = {
  [ProjectStatus.WAITING_PAYMENT]: 0,
  [ProjectStatus.ACTIVE]:          65,
  [ProjectStatus.PAUSED]:          40,
  [ProjectStatus.COMPLETED]:       100,
  [ProjectStatus.ARCHIVED]:        100,
};

const PROGRESS_COLOR: Record<ProjectStatus, string> = {
  [ProjectStatus.ACTIVE]:          'bg-[#C9A84C]',
  [ProjectStatus.WAITING_PAYMENT]: 'bg-[#C9A84C]',
  [ProjectStatus.PAUSED]:          'bg-[#e08c70]',
  [ProjectStatus.COMPLETED]:       'bg-[#2D6A4F]',
  [ProjectStatus.ARCHIVED]:        'bg-[#6B6A65]',
};

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

  const imageUrl = project.serviceType ? SERVICE_TYPE_IMAGES[project.serviceType] : DEFAULT_IMAGE;
  const progress = STATUS_PROGRESS[project.status] ?? 0;
  const progressColor = PROGRESS_COLOR[project.status] ?? 'bg-[#C9A84C]';
  const statusBadge = STATUS_BADGE[project.status] ?? 'bg-[#E5E2DE] text-[#656461]';
  const statusLabel = PROJECT_STATUS_LABELS[project.status] ?? project.status;

  const card = (
    <article className="bg-white rounded-xl overflow-hidden group hover:shadow-md transition-shadow border border-[#E2E1DC]/40">
      {/* Image */}
      <div className="h-40 relative overflow-hidden">
        <Image
          src={imageUrl}
          alt={project.serviceType ? SERVICE_TYPE_LABELS[project.serviceType] : 'Project'}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          unoptimized
        />
        {/* Status badge top-right */}
        <div className="absolute top-3 right-3">
          <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${statusBadge}`}>
            {statusLabel}
          </span>
        </div>
        {/* Admin actions top-left (on hover) */}
        {isAdmin && (
          <div className="absolute top-3 left-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleEdit}
              className="p-1.5 bg-white/90 backdrop-blur-sm text-[#1B1C1A] rounded-lg hover:bg-white transition-colors"
              aria-label={`Edit ${project.name}`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={handleDelete}
              className="p-1.5 bg-white/90 backdrop-blur-sm text-[#BA1A1A] rounded-lg hover:bg-white transition-colors"
              aria-label={`Delete ${project.name}`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-0.5">
          <h3 className="font-bold text-[17px] text-[#1B1C1A] truncate leading-snug flex-1">{project.name}</h3>
          {project.serviceType && (
            <span className={`flex-shrink-0 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${SERVICE_TYPE_COLORS[project.serviceType]}`}>
              {SERVICE_TYPE_LABELS[project.serviceType]}
            </span>
          )}
        </div>
        {project.client && (
          <p className="text-sm text-[#6B6A65] mt-1 truncate">
            {project.client.firstName} {project.client.lastName}
          </p>
        )}

        {/* Budget + Deadline */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          {project.initialAmountRequired != null && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#6B6A65] mb-1">Budget</p>
              <p className="font-bold text-[#1B1C1A] text-sm">{formatCurrency(project.initialAmountRequired)}</p>
            </div>
          )}
          {project.deadlineDate && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#6B6A65] mb-1">Deadline</p>
              <p className="font-bold text-[#1B1C1A] text-sm">{formatDate(project.deadlineDate)}</p>
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[11px] font-semibold text-[#6B6A65]">Progress</span>
            <span className="text-[11px] font-bold text-[#1B1C1A]">{progress}%</span>
          </div>
          <div className="w-full bg-[#F5F4F0] h-1.5 rounded-full overflow-hidden">
            <div className={`${progressColor} h-full rounded-full transition-all`} style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* View Details */}
        {onClick && (
          <button
            type="button"
            className="mt-4 w-full py-2 border border-[#E2E1DC] text-[#1B1C1A] text-sm font-semibold rounded-lg hover:bg-[#F5F4F0] transition-colors"
          >
            View Details
          </button>
        )}
      </div>
    </article>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={handleCardClick}
        className="w-full text-left focus:outline-none focus:ring-2 focus:ring-[#C9A84C] focus:ring-offset-2 rounded-xl"
        aria-label={`View project ${project.name}`}
      >
        {card}
      </button>
    );
  }

  return card;
}

export default React.memo(ProjectCard, (prevProps, nextProps) => {
  return (
    prevProps.project.id === nextProps.project.id &&
    prevProps.project.name === nextProps.project.name &&
    prevProps.project.status === nextProps.project.status &&
    prevProps.project.serviceType === nextProps.project.serviceType &&
    prevProps.project._count?.files === nextProps.project._count?.files &&
    prevProps.isAdmin === nextProps.isAdmin
  );
});
