import { Project, ProjectStatus } from '@/types';
import { ProjectStatusBadge } from '@/components/projects/ProjectStatusBadge';

interface ProjectStatusSectionProps {
  project: Project;
  isAdmin: boolean;
  onActivate?: () => void;
  onComplete?: () => void;
  processing?: boolean;
}

/**
 * Project Status Section
 * Displays project status badge and action buttons for status changes
 */
export function ProjectStatusSection({
  project,
  isAdmin,
  onActivate,
  onComplete,
  processing = false,
}: Readonly<ProjectStatusSectionProps>) {
  const canActivate = isAdmin &&
    project.status === ProjectStatus.WAITING_PAYMENT &&
    project.amountPaid >= (project.initialAmountRequired ?? 0);

  const canComplete = isAdmin && project.status === ProjectStatus.ACTIVE;

  return (
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-sm font-medium text-[#6B6A65] mb-2">Project Status</h3>
        <ProjectStatusBadge status={project.status} />
      </div>

      {isAdmin && (
        <div className="flex gap-3">
          {canActivate && onActivate && (
            <button
              onClick={onActivate}
              disabled={processing}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? 'Activating...' : 'Activate Project'}
            </button>
          )}

          {canComplete && onComplete && (
            <button
              onClick={onComplete}
              disabled={processing}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? 'Completing...' : 'Mark as Complete'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
