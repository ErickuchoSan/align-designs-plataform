'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FeedbackTimeline } from '@/components/feedback/FeedbackTimeline';
import { FeedbackThread } from '@/components/feedback/FeedbackThread';
import { useAuth } from '@/contexts/AuthContext';
import { useProjectFeedbackCyclesQuery, useFeedbackCyclesRefresh } from '@/hooks/queries';

export default function ProjectFeedbackPage() {
    const params = useParams();
    const router = useRouter();
    const projectId = params.id as string;
    const { user } = useAuth();

    const [selectedCycleId, setSelectedCycleId] = useState<string | null>(null);

    // TanStack Query: fetch feedback cycles
    const { data: cycles = [], isLoading } = useProjectFeedbackCyclesQuery(projectId, {
        enabled: !!projectId,
    });

    // Hook for silent refresh
    const refreshData = useFeedbackCyclesRefresh(projectId);

    // Auto-select first cycle when data loads
    useEffect(() => {
        if (cycles.length > 0 && selectedCycleId === null) {
            setSelectedCycleId(cycles[0].id);
        }
    }, [cycles, selectedCycleId]);

    const selectedCycle = cycles.find(c => c.id === selectedCycleId);

    return (
        <div className="p-6 max-w-7xl mx-auto h-[calc(100vh-100px)] flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <button
                        onClick={() => router.back()}
                        className="text-gray-500 hover:text-gray-700 mb-2 flex items-center gap-1 text-sm"
                    >
                        ← Back to Project
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Feedback Cycles
                    </h1>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-6 flex-1 min-h-0">
                <div className="col-span-4 overflow-y-auto pr-2">
                    <h2 className="font-semibold text-gray-700 mb-4">History</h2>
                    <FeedbackTimeline
                        cycles={cycles}
                        isLoading={isLoading}
                        onCycleSelect={setSelectedCycleId}
                        selectedCycleId={selectedCycleId || undefined}
                    />
                </div>
                <div className="col-span-8 h-full">
                    {selectedCycle ? (
                        <FeedbackThread
                            cycle={selectedCycle}
                            onUpdate={refreshData}
                            currentUserId={user?.id || ''}
                        />
                    ) : (
                        <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200 text-gray-400">
                            Select a cycle to view details
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
