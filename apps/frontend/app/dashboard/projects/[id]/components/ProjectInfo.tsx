import { formatDate } from '@/lib/utils/date.utils';
import { Project } from '@/types';

interface ProjectInfoProps {
  project: Project;
}

/**
 * Displays project information including client details and file/comment counts
 * Extracted from ProjectDetailsPage for better maintainability
 */
export default function ProjectInfo({ project }: Readonly<ProjectInfoProps>) {
  if (!project.client) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-stone-200 p-6 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-gradient-to-br from-navy-600 to-navy-800 rounded-full flex items-center justify-center text-gold-400 font-bold">
          {project.client.firstName[0]}{project.client.lastName[0]}
        </div>
        <div>
          <p className="font-semibold text-navy-900">
            {project.client.firstName} {project.client.lastName}
          </p>
          <p className="text-sm text-stone-700">{project.client.email}</p>
        </div>
      </div>
      <div className="flex items-center gap-4 text-sm text-stone-700">
        {project._count && (
          <>
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              {project._count.files} file{project._count.files !== 1 ? 's' : ''}
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              {project._count.comments} comment{project._count.comments !== 1 ? 's' : ''}
            </span>
          </>
        )}
        <span>
          Created: {formatDate(project.createdAt, 'LONG')}
        </span>
      </div>
    </div>
  );
}
