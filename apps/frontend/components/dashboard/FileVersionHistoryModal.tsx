import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { formatDate } from '@/lib/utils/date.utils';
import { FileData } from '@/app/dashboard/projects/[id]/hooks/useProjectFiles';

interface FileVersionHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    file: FileData;
    onDownload: (fileId: string, fileName: string) => void;
}

export default function FileVersionHistoryModal({ isOpen, onClose, file, onDownload }: Readonly<FileVersionHistoryModalProps>) {
    // File history is derived from the current file - no state needed

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Submission Comments: ${file.originalName}`} size="lg">
            <div className="space-y-4">
                {file.comment ? (
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-gray-900">
                                {file.uploader?.firstName || 'Unknown'} {file.uploader?.lastName || 'User'}
                            </span>
                            <span className="text-xs text-gray-500">
                                {formatDate(file.uploadedAt)}
                            </span>
                        </div>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                            {file.comment}
                        </p>
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-500 italic">
                        No comments provided for this submission.
                    </div>
                )}
            </div>

            <div className="mt-6 flex justify-end">
                <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    onClick={onClose}
                >
                    Close
                </button>
            </div>
        </Modal>
    );
}
