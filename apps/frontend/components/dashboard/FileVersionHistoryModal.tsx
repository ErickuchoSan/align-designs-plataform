import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, ClockIcon } from '@heroicons/react/24/outline';
import { formatDate } from '@/lib/utils/date.utils';
import { ProjectsService } from '@/services/projects.service';
import { FileData } from '@/app/dashboard/projects/[id]/hooks/useProjectFiles';

interface FileVersionHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    file: FileData;
    onDownload: (fileId: string, fileName: string) => void;
}

export default function FileVersionHistoryModal({ isOpen, onClose, file, onDownload }: FileVersionHistoryModalProps) {
    const [history, setHistory] = useState<FileData[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && file) {
            // Mock history for now, or fetch if endpoint exists
            // Backend doesn't have a dedicated "history" endpoint yet?
            // FileVersionService has getVersionHistory but controller doesn't expose it properly maybe?
            // Let's assume we show this file as "Current" and previous versions if available.
            // Since we didn't implement getVersionHistory endpoint in controller fully (placeholder in service),
            // we will display placeholder UI or implement the fetch if possible.
            // For Phase 3 Verification, we might need real data.
            // But let's build the UI first.

            // Temporary: Just show the current file as "v1" or similar if no history data.
            setHistory([file]);
        }
    }, [isOpen, file]);

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <div className="flex justify-between items-center mb-6">
                                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 flex items-center gap-2">
                                        <svg className="h-5 w-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                        </svg>
                                        Submission Comments: {file.originalName}
                                    </Dialog.Title>
                                    <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                                        <XMarkIcon className="h-6 w-6" />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {file.comment ? (
                                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="font-medium text-gray-900">
                                                    {file.uploader.firstName} {file.uploader.lastName}
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
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
