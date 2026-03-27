import { memo, useMemo } from 'react';
import { useProjectTrackingStatsQuery } from '@/hooks/queries';

interface TimeTrackingChartsProps {
    projectId: string;
}

function TimeTrackingCharts({ projectId }: Readonly<TimeTrackingChartsProps>) {
    // TanStack Query: fetch project tracking stats
    const { data: stats, isLoading, error } = useProjectTrackingStatsQuery(projectId, {
        enabled: !!projectId,
    });

    // Memoize expensive calculations
    const rejectionPercentage = useMemo(() => {
        return ((stats?.rejectionRate || 0) * 100).toFixed(0);
    }, [stats?.rejectionRate]);

    const averageCycleDuration = useMemo(() => {
        return (stats?.averageCycleDuration || 0).toFixed(1);
    }, [stats?.averageCycleDuration]);

    if (isLoading) {
        return <div className="animate-pulse h-32 bg-gray-100 rounded-lg"></div>;
    }

    if (error || !stats) {
        return null;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {/* Total Duration Card */}
            <div className="bg-white p-6 rounded-xl">
                <div className="flex items-center">
                    <div className="p-3 rounded-full bg-indigo-100 text-indigo-600 mr-4">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-[#6B6A65]">Total Duration</p>
                        <p className="text-2xl font-semibold text-[#1B1C1A]">
                            {stats.durationDays || 0}d {stats.durationHours || 0}h {stats.durationMinutes || 0}m
                        </p>
                    </div>
                </div>
            </div>

            {/* Cycles & Avg Duration */}
            <div className="bg-white p-6 rounded-xl">
                <div className="flex items-center">
                    <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-[#6B6A65]">Avg. Cycle Duration</p>
                        <p className="text-2xl font-semibold text-[#1B1C1A]">
                            {averageCycleDuration} <span className="text-sm font-normal text-[#6B6A65]">days</span>
                        </p>
                        <p className="text-xs text-[#6B6A65] mt-1">{stats.totalCycles || 0} total feedback cycles</p>
                    </div>
                </div>
            </div>

            {/* Rejections */}
            <div className="bg-white p-6 rounded-xl">
                <div className="flex items-center">
                    <div className="p-3 rounded-full bg-red-100 text-red-600 mr-4">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-[#6B6A65]">Rejection Rate</p>
                        <p className="text-2xl font-semibold text-[#1B1C1A]">
                            {rejectionPercentage}%
                        </p>
                        <p className="text-xs text-[#6B6A65] mt-1">{stats.totalRejections || 0} rejected files</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Memoize component to prevent unnecessary re-renders
// Only re-render when projectId changes
export default memo(TimeTrackingCharts);
