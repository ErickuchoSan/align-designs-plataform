import { formatDate } from '@/lib/utils/date.utils';
import { sanitizeText } from '@/lib/utils/text.utils';
import { formatFileSize, getFileExtension } from '@/lib/utils/file.utils';
import type { FileData } from '../hooks/useProjectFiles';

interface FileListProps {
  files: FileData[];
  onDownload: (fileId: string, fileName: string) => void;
  onEdit: (file: FileData) => void;
  onDelete: (file: FileData) => void;
  canDelete: (file: FileData) => boolean;
}

export default function FileList({
  files,
  onDownload,
  onEdit,
  onDelete,
  canDelete,
}: FileListProps) {
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
    <div className="bg-white rounded-2xl shadow-lg border border-stone-200 overflow-hidden">
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
              <tr key={file.id} className="hover:bg-stone-50 transition-colors">
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
                        <svg className="w-5 h-5 text-gold-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                        </svg>
                        <div className="text-sm font-medium text-stone-700 italic">No file</div>
                      </>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {file.filename ? (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gold-100 text-gold-800">
                      {getFileExtension(file.originalName || '').toUpperCase()}
                    </span>
                  ) : (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-stone-200 text-stone-700">
                      COMMENT
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-700">
                  {file.sizeBytes ? formatFileSize(file.sizeBytes) : '-'}
                </td>
                <td className="px-6 py-4 max-w-xs">
                  {file.comment ? (
                    <div className="text-sm text-stone-700 truncate" title={sanitizeText(file.comment)}>
                      {sanitizeText(file.comment)}
                    </div>
                  ) : (
                    <span className="text-sm text-stone-700 italic">No comment</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-navy-900">{file.uploader.firstName} {file.uploader.lastName}</div>
                  <div className="text-xs text-stone-700">{file.uploader.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-700">
                  {formatDate(file.uploadedAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end gap-2">
                    {file.filename && (
                      <button
                        onClick={() => onDownload(file.id, file.originalName!)}
                        className="p-2 text-navy-700 hover:bg-navy-50 rounded-lg transition-colors"
                        title="Download"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                    )}
                    {canDelete(file) && (
                      <>
                        <button
                          onClick={() => onEdit(file)}
                          className="p-2 text-gold-600 hover:bg-gold-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => onDelete(file)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
