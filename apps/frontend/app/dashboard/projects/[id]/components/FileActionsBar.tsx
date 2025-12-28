import FileFilters from './FileFilters';
import { Project, ProjectStatus } from '@/types';

interface FileActionsBarProps {
  nameFilter: string;
  setNameFilter: (value: string) => void;
  typeFilter: string;
  setTypeFilter: (value: string) => void;
  availableTypes: string[];
  onOpenCommentModal: () => void;
  onOpenUploadModal: () => void;
  project: Project | null;
}

/**
 * Action bar for file operations including filters and action buttons
 * Extracted from ProjectDetailsPage for better maintainability
 */
export default function FileActionsBar({
  nameFilter,
  setNameFilter,
  typeFilter,
  setTypeFilter,
  availableTypes,
  onOpenCommentModal,
  onOpenUploadModal,
  project,
}: FileActionsBarProps) {
  const isProjectActive = project?.status === ProjectStatus.ACTIVE;
  const isWaitingPayment = project?.status === ProjectStatus.WAITING_PAYMENT;

  return (
    <div className="mb-6">
      {/* Warning message when project is inactive */}
      {isWaitingPayment && (
        <div className="mb-4 rounded-lg bg-yellow-50 border-l-4 border-yellow-500 p-4 shadow-sm">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-semibold text-yellow-800">
                🔒 Project Waiting for Payment
              </h3>
              <p className="mt-1 text-sm text-yellow-700">
                This project will be activated once the client pays the initial amount of ${project.initialAmountRequired?.toLocaleString() || '0'}.
                Currently paid: ${project.amountPaid?.toLocaleString() || '0'}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <FileFilters
          nameFilter={nameFilter}
          setNameFilter={setNameFilter}
          typeFilter={typeFilter}
          setTypeFilter={setTypeFilter}
          availableTypes={availableTypes}
        />
        <div className="flex gap-3">
          <button
            onClick={onOpenCommentModal}
            disabled={!isProjectActive}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg shadow-lg transition-all ${
              isProjectActive
                ? 'bg-gold-600 text-white hover:bg-gold-700 hover:shadow-xl'
                : 'bg-stone-300 text-stone-500 cursor-not-allowed'
            }`}
            title={!isProjectActive ? 'Project must be active to create comments' : ''}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
            Create Comment
          </button>
          <button
            onClick={onOpenUploadModal}
            disabled={!isProjectActive}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg shadow-lg transition-all ${
              isProjectActive
                ? 'bg-navy-800 text-white hover:bg-navy-700 hover:shadow-xl'
                : 'bg-stone-300 text-stone-500 cursor-not-allowed'
            }`}
            title={!isProjectActive ? 'Project must be active to upload files' : ''}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Upload File
          </button>
        </div>
      </div>
    </div>
  );
}
