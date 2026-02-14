'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FeedbackTimeline } from '@/components/feedback/FeedbackTimeline';
import { FeedbackThread } from '@/components/feedback/FeedbackThread';
import { FeedbackService } from '@/services/feedback.service';
import { FeedbackCycle } from '@/types/feedback';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';

export default function ProjectFeedbackPage() {
    const params = useParams();
    const router = useRouter();
    const projectId = params.id as string;
    const { user } = useAuth(); // Need to get current user ID

    const [cycles, setCycles] = useState<FeedbackCycle[]>([]);
    const [selectedCycleId, setSelectedCycleId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await FeedbackService.getProjectCycles(projectId);
            setCycles(data);
            // Select first cycle by default if none selected
            if (!selectedCycleId && data.length > 0) {
                setSelectedCycleId(data[0].id);
            }
        } catch (error) {
            logger.error('Error loading feedback:', error);
            toast.error('Error loading feedback');
        } finally {
            setIsLoading(false);
        }
    }, [projectId]); // Remove selectedCycleId from deps to avoid loop

    // Separate function for refreshing without resetting loading state
    const refreshData = async () => {
        try {
            const data = await FeedbackService.getProjectCycles(projectId);
            setCycles(data);
        } catch (error) {
            logger.error('Error refreshing feedback data', error);
        }
    };

    useEffect(() => {
        if (projectId) {
            loadData();
        }
    }, [projectId, loadData]);

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
