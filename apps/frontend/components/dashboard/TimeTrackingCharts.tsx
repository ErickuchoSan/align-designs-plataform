import { useEffect, useState } from 'react';
import { TrackingService, ProjectTrackingStats } from '@/services/tracking.service';

interface TimeTrackingChartsProps {
    projectId: string;
}

export default function TimeTrackingCharts({ projectId }: TimeTrackingChartsProps) {
    const [stats, setStats] = useState<ProjectTrackingStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        async function loadStats() {
            try {
                setLoading(true);
                const data = await TrackingService.getProjectStats(projectId);
                setStats(data);
            } catch (err) {
                console.error('Failed to load tracking stats', err);
                setError('Could not load time tracking data');
            } finally {
                setLoading(false);
            }
        }

        if (projectId) {
            loadStats();
        }
    }, [projectId]);

    if (loading) {
        return <div className="animate-pulse h-32 bg-gray-100 rounded-lg"></div>;
    }

    if (error || !stats) {
        return null;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {/* Total Duration Card */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
                <div className="flex items-center">
                    <div className="p-3 rounded-full bg-indigo-100 text-indigo-600 mr-4">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-stone-500">Total Duration</p>
                        <p className="text-2xl font-semibold text-navy-900">
                            {stats.totalDurationDays.toFixed(1)} <span className="text-sm font-normal text-stone-500">days</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Cycles & Avg Duration */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
                <div className="flex items-center">
                    <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-stone-500">Avg. Cycle Duration</p>
                        <p className="text-2xl font-semibold text-navy-900">
                            {stats.averageCycleDuration.toFixed(1)} <span className="text-sm font-normal text-stone-500">days</span>
                        </p>
                        <p className="text-xs text-stone-400 mt-1">{stats.totalCycles} total feedback cycles</p>
                    </div>
                </div>
            </div>

            {/* Rejections */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
                <div className="flex items-center">
                    <div className="p-3 rounded-full bg-red-100 text-red-600 mr-4">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-stone-500">Rejection Rate</p>
                        <p className="text-2xl font-semibold text-navy-900">
                            {(stats.rejectionRate * 100).toFixed(0)}%
                        </p>
                        <p className="text-xs text-stone-400 mt-1">{stats.totalRejections} rejected files</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
