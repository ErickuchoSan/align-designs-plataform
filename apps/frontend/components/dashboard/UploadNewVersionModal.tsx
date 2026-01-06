import React, { useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { XMarkIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { ProjectsService } from '@/services/projects.service';
import { logger } from '@/lib/logger';

interface UploadNewVersionModalProps {
    isOpen: boolean;
    onClose: () => void;
    parentFileId: string;
    projectId: string; // Needed if endpoint requires it, though :id/version relies on fileId.
    onSuccess: () => void;
}

export default function UploadNewVersionModal({ isOpen, onClose, parentFileId, projectId, onSuccess }: UploadNewVersionModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [notes, setNotes] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            toast.error('Please select a file');
            return;
        }

        setIsUploading(true);
        try {
            // Assuming wrapper in generic API or specialized service method
            // We might need to add uploadVersion method to ProjectsService or FilesService (frontend)
            await ProjectsService.uploadFileVersion(parentFileId, file, notes);
            toast.success('New version uploaded successfully');
            onSuccess();
            onClose();
            setFile(null);
            setNotes('');
        } catch (error) {
            logger.error('Failed to upload file version', error, { parentFileId, projectId });
            toast.error('Failed to upload new version');
        } finally {
            setIsUploading(false);
        }
    };

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
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <div className="flex justify-between items-center mb-4">
                                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                                        Upload New Version
                                    </Dialog.Title>
                                    <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                                        <XMarkIcon className="h-6 w-6" />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-indigo-500 transition-colors">
                                        <input
                                            type="file"
                                            id="version-file-upload"
                                            className="hidden"
                                            onChange={handleFileChange}
                                        />
                                        <label htmlFor="version-file-upload" className="cursor-pointer flex flex-col items-center">
                                            <ArrowUpTrayIcon className="h-12 w-12 text-gray-400 mb-2" />
                                            <span className="text-sm text-gray-600 font-medium">
                                                {file ? file.name : 'Click to select file'}
                                            </span>
                                            <span className="text-xs text-gray-500 mt-1">
                                                Select the updated version of the file
                                            </span>
                                        </label>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Version Notes (Optional)
                                        </label>
                                        <textarea
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                            rows={3}
                                            placeholder="What changed in this version?"
                                        />
                                    </div>
                                </div>

                                <div className="mt-6 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 filter-button"
                                        onClick={onClose}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        onClick={handleUpload}
                                        disabled={!file || isUploading}
                                    >
                                        {isUploading ? 'Uploading...' : 'Upload Version'}
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
