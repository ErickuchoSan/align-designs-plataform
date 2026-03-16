import { FeedbackCycle } from '../../types/feedback';

interface FeedbackTimelineProps {
    cycles: FeedbackCycle[];
    isLoading: boolean;
    onCycleSelect: (cycleId: string) => void;
    selectedCycleId?: string;
}

// Get status badge color class
const getStatusBadgeClass = (status: string): string => {
    if (status === 'open') return 'bg-green-100 text-green-800';
    if (status === 'submitted') return 'bg-yellow-100 text-yellow-800';
    if (status === 'approved') return 'bg-blue-100 text-blue-800';
    return 'bg-red-100 text-red-800';
};

export function FeedbackTimeline({ cycles, isLoading, onCycleSelect, selectedCycleId }: Readonly<FeedbackTimelineProps>) {
    if (isLoading) {
        return <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-100 rounded"></div>)}
        </div>;
    }

    if (cycles.length === 0) {
        return <div className="text-center py-8 text-gray-500">No feedback cycles found.</div>;
    }

    return (
        <div className="space-y-4">
            {cycles.map((cycle, index) => (
                <button
                    key={cycle.id}
                    type="button"
                    onClick={() => onCycleSelect(cycle.id)}
                    className={`w-full text-left p-4 rounded-lg border transition-all ${selectedCycleId === cycle.id
                        ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                        }`}
                >
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <h4 className="font-semibold text-gray-900">Cycle {cycles.length - index}</h4>
                            <p className="text-sm text-gray-500">
                                Started by: {cycle.employee.firstName} {cycle.employee.lastName}
                            </p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(cycle.status)}`}>
                            {cycle.status.toUpperCase()}
                        </span>
                    </div>
                    <div className="text-xs text-gray-400">
                        {new Date(cycle.startDate).toLocaleString()}
                    </div>
                </button>
            ))}
        </div>
    );
}
