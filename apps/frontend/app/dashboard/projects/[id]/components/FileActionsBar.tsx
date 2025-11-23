import FileFilters from './FileFilters';

interface FileActionsBarProps {
  nameFilter: string;
  setNameFilter: (value: string) => void;
  typeFilter: string;
  setTypeFilter: (value: string) => void;
  availableTypes: string[];
  onOpenCommentModal: () => void;
  onOpenUploadModal: () => void;
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
}: FileActionsBarProps) {
  return (
    <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
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
          className="flex items-center gap-2 px-5 py-2.5 bg-gold-600 text-white rounded-lg hover:bg-gold-700 shadow-lg hover:shadow-xl transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
          Create Comment
        </button>
        <button
          onClick={onOpenUploadModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-navy-800 text-white rounded-lg hover:bg-navy-700 shadow-lg hover:shadow-xl transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          Upload File
        </button>
      </div>
    </div>
  );
}
