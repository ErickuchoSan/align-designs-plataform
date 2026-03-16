import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { toast } from '@/lib/toast';
import { ProjectsService } from '@/services/projects.service';
import { useAsyncOperation } from '@/hooks';
import { cn, TEXTAREA_BASE, INPUT_VARIANTS } from '@/lib/styles';

interface UploadNewVersionModalProps {
    isOpen: boolean;
    onClose: () => void;
    parentFileId: string;
    projectId: string; // Needed if endpoint requires it, though :id/version relies on fileId.
    onSuccess: () => void;
}

export default function UploadNewVersionModal({ isOpen, onClose, parentFileId, projectId, onSuccess }: Readonly<UploadNewVersionModalProps>) {
    const [file, setFile] = useState<File | null>(null);
    const [notes, setNotes] = useState('');

    // DRY: Use useAsyncOperation for upload handling
    const { loading: isUploading, execute } = useAsyncOperation();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            toast.error('Please select a file');
            return;
        }

        // DRY: Use execute() for automatic loading state and error handling
        await execute(
            () => ProjectsService.uploadFileVersion(parentFileId, file, notes),
            {
                successMessage: 'New version uploaded successfully',
                errorMessagePrefix: 'Failed to upload new version',
                onSuccess: () => {
                    onSuccess();
                    onClose();
                    setFile(null);
                    setNotes('');
                },
            }
        );
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Upload New Version" size="md">
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
                    <label htmlFor="version-notes" className="block text-sm font-medium text-gray-700 mb-1">
                        Version Notes (Optional)
                    </label>
                    <textarea
                        id="version-notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className={cn(TEXTAREA_BASE, INPUT_VARIANTS.default)}
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
        </Modal>
    );
}
