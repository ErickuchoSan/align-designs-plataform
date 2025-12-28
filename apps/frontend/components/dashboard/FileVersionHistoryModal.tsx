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
                                        <ClockIcon className="h-5 w-5 text-indigo-500" />
                                        Version History: {file.originalName}
                                    </Dialog.Title>
                                    <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                                        <XMarkIcon className="h-6 w-6" />
                                    </button>
                                </div>

                                <div className="flow-root">
                                    <ul role="list" className="-mb-8">
                                        {history.map((version, versionIdx) => (
                                            <li key={version.id}>
                                                <div className="relative pb-8">
                                                    {versionIdx !== history.length - 1 ? (
                                                        <span
                                                            className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                                                            aria-hidden="true"
                                                        />
                                                    ) : null}
                                                    <div className="relative flex space-x-3">
                                                        <div>
                                                            <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${versionIdx === 0 ? 'bg-indigo-500' : 'bg-gray-400'
                                                                }`}>
                                                                <span className="text-white text-xs font-bold">
                                                                    {version.versionLabel || `v${version.versionNumber || 1}`}
                                                                </span>
                                                            </span>
                                                        </div>
                                                        <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                                                            <div>
                                                                <p className="text-sm text-gray-500">
                                                                    Uploaded by <span className="font-medium text-gray-900">{version.uploader.firstName}</span>
                                                                </p>
                                                                {version.comment && (
                                                                    <p className="mt-1 text-sm text-gray-700 bg-gray-50 p-2 rounded">
                                                                        {version.comment}
                                                                    </p>
                                                                )}
                                                            </div>
                                                            <div className="whitespace-nowrap text-right text-sm text-gray-500">
                                                                <time dateTime={version.uploadedAt}>{formatDate(version.uploadedAt)}</time>
                                                                <button
                                                                    onClick={() => onDownload(version.id, version.originalName!)}
                                                                    className="block mt-1 text-indigo-600 hover:text-indigo-900 text-xs font-medium"
                                                                >
                                                                    Download
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
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
