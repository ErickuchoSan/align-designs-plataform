'use client';

import { ProjectStatus, PROJECT_STATUS_LABELS, PROJECT_STATUS_COLORS } from '@/types';

interface ProjectStatusBadgeProps {
  status: ProjectStatus;
  className?: string;
}

type ColorKey = 'yellow' | 'green' | 'blue' | 'gray';

/**
 * ProjectStatusBadge Component
 *
 * Displays a colored badge for project status
 * Colors: WAITING_PAYMENT (yellow), ACTIVE (green), COMPLETED (blue), ARCHIVED (gray)
 */
export function ProjectStatusBadge({ status, className = '' }: ProjectStatusBadgeProps) {
  const label = PROJECT_STATUS_LABELS[status];
  const color = PROJECT_STATUS_COLORS[status] as ColorKey;

  const colorClasses: Record<ColorKey, string> = {
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    green: 'bg-green-100 text-green-800 border-green-300',
    blue: 'bg-blue-100 text-blue-800 border-blue-300',
    gray: 'bg-gray-100 text-gray-800 border-gray-300',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClasses[color]} ${className}`}
    >
      {label}
    </span>
  );
}
