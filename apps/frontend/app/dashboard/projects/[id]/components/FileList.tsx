import { memo, useMemo } from 'react';
import { formatDate } from '@/lib/utils/date.utils';
import { sanitizeText } from '@/lib/utils/text.utils';
import { formatFileSize, getFileExtension } from '@/lib/utils/file.utils';
import type { FileData } from '../hooks/useProjectFiles';
import MobileFileCard from './MobileFileCard';

interface FileListProps {
  files: FileData[];
  onDownload: (fileId: string, fileName: string) => void;
  onEdit: (file: FileData) => void;
  onDelete: (file: FileData) => void;
  canDelete: (file: FileData) => boolean;
  onViewHistory: (file: FileData) => void;
  onUploadVersion: (file: FileData) => void;
}

// Memoized file row component to prevent unnecessary re-renders in large lists
const FileRow = memo(({
  file,
  onDownload,
  onEdit,
  onDelete,
  canDelete,
  onViewHistory,
  onUploadVersion
}: {
  file: FileData;
  onDownload: (fileId: string, fileName: string) => void;
  onEdit: (file: FileData) => void;
  onDelete: (file: FileData) => void;
  canDelete: (file: FileData) => boolean;
  onViewHistory: (file: FileData) => void;
  onUploadVersion: (file: FileData) => void;
}) => {
  // Memoize expensive operations
  const formattedDate = useMemo(() => formatDate(file.uploadedAt), [file.uploadedAt]);
  const formattedSize = useMemo(() => formatFileSize(file.sizeBytes || 0), [file.sizeBytes]);
  const fileExtension = useMemo(() => getFileExtension(file.originalName || ''), [file.originalName]);
  const uploaderName = useMemo(() =>
    file.uploader ? `${file.uploader.firstName} ${file.uploader.lastName}` : 'Unknown',
    [file.uploader]
  );

  return (
    <tr className="hover:bg-stone-50 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          {file.filename ? (
            <>
              <svg className="w-5 h-5 text-navy-700 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <div className="text-sm font-medium text-navy-900">{file.originalName}</div>
            </>
          ) : (
            <>
              <svg className="w-5 h-5 text-blue-700 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <div className="text-sm font-medium text-blue-900">Comment Only</div>
            </>
          )}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {file.filename ? (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-navy-100 text-navy-800">
            {fileExtension}
          </span>
        ) : (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
            COMMENT
          </span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-700">
        {file.filename ? formattedSize : '-'}
      </td>
      <td className="px-6 py-4 max-w-xs">
        <div className="text-sm text-stone-700 line-clamp-2">
          {file.comment ? sanitizeText(file.comment) : '-'}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-700">
        {uploaderName}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-700">
        {formattedDate}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex items-center justify-end gap-2">
          {file.filename && (
            <>
              <button
                onClick={() => onDownload(file.id, file.originalName ?? '')}
                className="p-2 text-stone-600 hover:text-navy-600 hover:bg-stone-200 rounded-lg transition-colors"
                title="Download"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button>
              <button
                onClick={() => onViewHistory(file)}
                className="p-2 text-stone-600 hover:text-blue-600 hover:bg-stone-200 rounded-lg transition-colors"
                title="Version History"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              <button
                onClick={() => onUploadVersion(file)}
                className="p-2 text-stone-600 hover:text-green-600 hover:bg-stone-200 rounded-lg transition-colors"
                title="Upload New Version"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </button>
            </>
          )}
          <button
            onClick={() => onEdit(file)}
            className="p-2 text-stone-600 hover:text-gold-600 hover:bg-stone-200 rounded-lg transition-colors"
            title="Edit"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          {canDelete(file) && (
            <button
              onClick={() => onDelete(file)}
              className="p-2 text-stone-600 hover:text-red-600 hover:bg-stone-200 rounded-lg transition-colors"
              title="Delete"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </td>
    </tr>
  );
});

FileRow.displayName = 'FileRow';

function FileList({
  files,
  onDownload,
  onEdit,
  onDelete,
  canDelete,
  onViewHistory,
  onUploadVersion,
}: Readonly<FileListProps>) {
  if (files.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-12 text-center shadow-lg border border-stone-200">
        <div className="mx-auto w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-stone-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="text-lg text-navy-900 font-medium">No files in this project</p>
        <p className="text-sm text-stone-700 mt-2">Upload your first file to get started</p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-2xl shadow-lg border border-stone-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-stone-200">
            <thead className="bg-stone-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-navy-900 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-navy-900 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-navy-900 uppercase tracking-wider">
                  Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-navy-900 uppercase tracking-wider">
                  Comment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-navy-900 uppercase tracking-wider">
                  Uploaded by
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-navy-900 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-navy-900 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-stone-200">
              {files.map((file) => (
                <FileRow
                  key={file.id}
                  file={file}
                  onDownload={onDownload}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  canDelete={canDelete}
                  onViewHistory={onViewHistory}
                  onUploadVersion={onUploadVersion}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {files.map((file) => (
          <MobileFileCard
            key={file.id}
            file={file}
            onDownload={onDownload}
            onEdit={onEdit}
            onDelete={onDelete}
            canDelete={canDelete}
            onViewHistory={onViewHistory}
            onUploadVersion={onUploadVersion}
          />
        ))}
      </div>
    </>
  );
}

// Export memoized component to prevent unnecessary re-renders
// Only re-renders when files array or callback functions change
export default memo(FileList);
