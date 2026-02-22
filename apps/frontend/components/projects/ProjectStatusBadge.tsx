'use client';

import { memo } from 'react';
import { ProjectStatus, PROJECT_STATUS_LABELS, PROJECT_STATUS_COLORS } from '@/types';
import { Badge } from '@/components/ui/Badge';
import type { BadgeColor } from '@/lib/styles';

interface ProjectStatusBadgeProps {
  status: ProjectStatus;
  className?: string;
}

/**
 * ProjectStatusBadge Component
 *
 * Displays a colored badge for project status
 * Colors: WAITING_PAYMENT (yellow), ACTIVE (green), COMPLETED (blue), ARCHIVED (gray)
 */
export const ProjectStatusBadge = memo(function ProjectStatusBadge({
  status,
  className = '',
}: ProjectStatusBadgeProps) {
  const label = PROJECT_STATUS_LABELS[status];
  const color = PROJECT_STATUS_COLORS[status] as BadgeColor;

  return (
    <Badge color={color} withBorder className={className}>
      {label}
    </Badge>
  );
});
