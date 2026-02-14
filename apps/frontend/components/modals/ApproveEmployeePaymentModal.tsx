'use client';

import { useState, useRef } from 'react';
import { ButtonLoader } from '@/components/ui/Loader';
import Modal from '@/components/ui/Modal';

interface ApproveEmployeePaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (file: File) => Promise<void>;
    isLoading: boolean;
}

export default function ApproveEmployeePaymentModal({
    isOpen,
    onClose,
    onConfirm,
    isLoading,
}: ApproveEmployeePaymentModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleConfirm = async () => {
        if (!file) return;
        await onConfirm(file);
        setFile(null); // Reset after success
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Approve Payment">
            <div className="space-y-6">
                <div className="flex flex-col items-center justify-center p-4">
                    <div className="rounded-full bg-navy-100 p-3 mb-4">
                        <svg className="h-6 w-6 text-navy-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-stone-900 text-center mb-2">
                        Confirm Payment Approval
                    </h3>
                    <p className="text-sm text-stone-600 text-center mb-6">
                        To approve this payment, you must upload the transfer receipt/proof.
                    </p>

                    <div className="w-full">
                        <label className="block text-sm font-medium text-stone-700 mb-2">
                            Upload Transfer Receipt *
                        </label>
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-stone-300 border-dashed rounded-lg cursor-pointer hover:border-navy-500 transition-colors bg-stone-50 hover:bg-white"
                        >
                            <div className="space-y-1 text-center">
                                <svg
                                    className="mx-auto h-12 w-12 text-stone-400"
                                    stroke="currentColor"
                                    fill="none"
                                    viewBox="0 0 48 48"
                                    aria-hidden="true"
                                >
                                    <path
                                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                                        strokeWidth={2}
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                                <div className="flex text-sm text-stone-600 justify-center">
                                    <span className="relative cursor-pointer bg-white rounded-md font-medium text-navy-600 hover:text-navy-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-navy-500">
                                        Upload a file
                                    </span>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        className="sr-only"
                                        accept="image/*,application/pdf"
                                        onChange={handleFileChange}
                                    />
                                </div>
                                <p className="text-xs text-stone-500">PNG, JPG, PDF up to 10MB</p>
                            </div>
                        </div>
                        {file && (
                            <div className="mt-2 flex items-center justify-between p-2 bg-navy-50 rounded text-sm text-navy-700">
                                <span className="truncate">{file.name}</span>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setFile(null);
                                        if (fileInputRef.current) fileInputRef.current.value = '';
                                    }}
                                    className="text-navy-500 hover:text-navy-700"
                                >
                                    Remove
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-col gap-2 px-4 py-3 -mx-6 -mb-6 bg-stone-50 rounded-b-lg sm:flex-row sm:justify-end sm:gap-3 sm:px-6">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="w-full px-4 py-2 font-medium text-stone-700 transition-colors bg-white border border-stone-300 rounded-lg hover:bg-stone-50 disabled:opacity-50 sm:w-auto"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isLoading || !file}
                        className="flex items-center justify-center w-full gap-2 px-4 py-2 font-medium text-white transition-colors bg-navy-600 rounded-lg hover:bg-navy-700 disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto"
                    >
                        {isLoading ? <ButtonLoader /> : 'Approve Payment'}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
