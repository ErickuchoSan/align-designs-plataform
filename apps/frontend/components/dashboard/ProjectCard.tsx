import { Project } from '@/types';
import { formatDate } from '@/lib/utils/date.utils';

interface ProjectCardProps {
  project: Project;
  isAdmin: boolean;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
  onClick?: (project: Project) => void;
  theme?: 'navy' | 'blue';
}

export default function ProjectCard({
  project,
  isAdmin,
  onEdit,
  onDelete,
  onClick,
  theme = 'navy',
}: ProjectCardProps) {
  const handleCardClick = () => {
    if (onClick) {
      onClick(project);
    }
  };

  const themeStyles = {
    navy: {
      card: 'bg-white shadow-lg border border-stone-200 hover:shadow-2xl',
      title: 'text-navy-900',
      avatar: 'bg-gradient-to-br from-navy-600 to-navy-800 text-gold-400',
      clientName: 'text-navy-900',
      clientEmail: 'text-stone-700',
      filesBadge: 'bg-gold-50 text-gold-700',
      date: 'text-stone-700',
      editButton: 'text-navy-700 hover:bg-navy-50',
      deleteButton: 'text-red-600 hover:bg-red-50',
    },
    blue: {
      card: 'bg-white shadow-md border border-gray-100 hover:shadow-2xl',
      title: 'text-gray-900',
      avatar: 'bg-gradient-to-br from-blue-500 to-indigo-500 text-white',
      clientName: 'text-gray-700',
      clientEmail: 'text-gray-700',
      filesBadge: 'bg-blue-50 text-blue-700',
      date: 'text-gray-700',
      editButton: 'text-blue-600 hover:bg-blue-50',
      deleteButton: 'text-red-600 hover:bg-red-50',
    },
  };

  const styles = themeStyles[theme];

  return (
    <div
      onClick={handleCardClick}
      className={`overflow-hidden rounded-2xl ${styles.card} transition-all duration-300 hover:scale-105 ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <h3 className={`text-xl font-bold ${styles.title} flex-1`}>
            {project.name}
          </h3>
          {isAdmin && (
            <div className="flex gap-2 ml-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(project);
                }}
                className={`p-2 ${styles.editButton} rounded-lg transition-colors`}
                title="Edit project"
                aria-label={`Edit project ${project.name}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(project);
                }}
                className={`p-2 ${styles.deleteButton} rounded-lg transition-colors`}
                title="Delete project"
                aria-label={`Delete project ${project.name}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              <p className={`font-medium ${styles.clientName}`}>
                {project.client.firstName} {project.client.lastName}
              </p>
              <p className={`text-xs ${styles.clientEmail}`}>{project.client.email}</p>
            </div>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-stone-200 flex items-center justify-between">
          {project._count && (
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${styles.filesBadge} text-xs font-medium`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                {project._count.files} file{project._count.files !== 1 ? 's' : ''}
              </span>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${styles.filesBadge} text-xs font-medium`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                {project._count.comments} comment{project._count.comments !== 1 ? 's' : ''}
              </span>
            </div>
          )}
          <p className={`text-xs ${styles.date}`}>
            {formatDate(project.createdAt)}
          </p>
        </div>
      </div>
    </div>
  );
}
