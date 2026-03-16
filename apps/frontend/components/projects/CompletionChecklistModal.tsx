'use client';

import Modal from '@/components/ui/Modal';
import { CheckIcon, CloseIcon } from '@/components/ui/icons';

interface CompletionChecklistModalProps {
    isOpen: boolean;
    onClose: () => void;
    isLoading: boolean;
    isReady: boolean;
    checklist: {
        allClientPaymentsReceived: boolean;
        allEmployeesPaid: boolean;
        noOpenFeedback: boolean;
        finalFilesDelivered: boolean;
    };
    counts: {
        pendingInvoices: number;
        pendingEmployeePayments: number;
        openFeedback: number;
    };
    onArchive: () => void;
}

export default function CompletionChecklistModal({
    isOpen,
    onClose,
    isLoading,
    isReady,
    checklist,
    counts,
    onArchive
}: Readonly<CompletionChecklistModalProps>) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Project Completion Checklist"
            size="lg"
        >
            <div className="space-y-6">
                <div className={`p-4 rounded-lg border ${isReady ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'
                    }`}>
                    <div className="flex gap-3">
                        <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${isReady ? 'bg-green-600 text-white' : 'bg-amber-500 text-white'
                            }`}>
                            {isReady ? (
                                <CheckIcon size="xs" />
                            ) : (
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01" />
                                </svg>
                            )}
                        </div>
                        <div>
                            <h4 className={`font-semibold ${isReady ? 'text-green-900' : 'text-amber-900'}`}>
                                {isReady ? 'Project Ready for Archiving' : 'Project Not Ready'}
                            </h4>
                            <p className={`text-sm mt-1 ${isReady ? 'text-green-700' : 'text-amber-700'}`}>
                                {isReady
                                    ? 'All criteria have been met. You can now safely archive this project.'
                                    : 'There are pending items that need to be resolved before archiving.'
                                }
                            </p>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    {/* Item 1: Client Payments */}
                    <div className="flex items-start justify-between p-3 bg-stone-50 rounded-lg">
                        <div className="flex gap-3">
                            <StatusIcon success={checklist.allClientPaymentsReceived} />
                            <div>
                                <p className="font-medium text-navy-900">Client Payments</p>
                                <p className="text-sm text-stone-500">All invoices must be paid</p>
                            </div>
                        </div>
                        {!checklist.allClientPaymentsReceived && (
                            <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded">
                                {counts.pendingInvoices} Pending
                            </span>
                        )}
                    </div>

                    {/* Item 2: Employee Payments */}
                    <div className="flex items-start justify-between p-3 bg-stone-50 rounded-lg">
                        <div className="flex gap-3">
                            <StatusIcon success={checklist.allEmployeesPaid} />
                            <div>
                                <p className="font-medium text-navy-900">Employee Payments</p>
                                <p className="text-sm text-stone-500">All pending files must be paid</p>
                            </div>
                        </div>
                        {!checklist.allEmployeesPaid && (
                            <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded">
                                {counts.pendingEmployeePayments} Pending
                            </span>
                        )}
                    </div>

                    {/* Item 3: Feedback */}
                    <div className="flex items-start justify-between p-3 bg-stone-50 rounded-lg">
                        <div className="flex gap-3">
                            <StatusIcon success={checklist.noOpenFeedback} />
                            <div>
                                <p className="font-medium text-navy-900">Feedback Cycles</p>
                                <p className="text-sm text-stone-500">All feedback cycles must be closed</p>
                            </div>
                        </div>
                        {!checklist.noOpenFeedback && (
                            <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded">
                                {counts.openFeedback} Open
                            </span>
                        )}
                    </div>

                    {/* Item 4: Delivery */}
                    <div className="flex items-start justify-between p-3 bg-stone-50 rounded-lg">
                        <div className="flex gap-3">
                            <StatusIcon success={checklist.finalFilesDelivered} />
                            <div>
                                <p className="font-medium text-navy-900">Final Delivery</p>
                                <p className="text-sm text-stone-500">At least one file delivered</p>
                            </div>
                        </div>
                        {!checklist.finalFilesDelivered && (
                            <span className="px-2 py-1 text-xs text-amber-700 bg-amber-100 font-medium rounded">
                                Missing
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-stone-100">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50 font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onArchive}
                        disabled={!isReady || isLoading}
                        className={`px-4 py-2 text-white rounded-lg font-medium transition-colors ${isReady && !isLoading
                            ? 'bg-navy-800 hover:bg-navy-700'
                            : 'bg-stone-400 cursor-not-allowed'
                            }`}
                    >
                        {isLoading ? 'Archiving...' : 'Confirm Archive'}
                    </button>
                </div>
            </div>
        </Modal>
    );
}

function StatusIcon({ success }: { success: boolean }) {
    if (success) {
        return (
            <div className="mt-0.5 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                <CheckIcon size="xs" />
            </div>
        );
    }
    return (
        <div className="mt-0.5 w-5 h-5 rounded-full bg-red-100 flex items-center justify-center text-red-600">
            <CloseIcon size="xs" />
        </div>
    );
}
