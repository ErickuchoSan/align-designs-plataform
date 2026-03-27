import { useMemo } from 'react';
import { formatDate } from '@/lib/date.utils';

interface Deadline {
  date: Date;
  label: string;
  invoiceId: string;
  amount: number;
}

interface DeadlinesSectionProps {
  deadlines: Deadline[];
  loading?: boolean;
}

/**
 * Deadlines Section
 * Displays upcoming invoice deadlines
 */
export function DeadlinesSection({ deadlines, loading = false }: Readonly<DeadlinesSectionProps>) {
  // Sort and format deadlines
  const sortedDeadlines = useMemo(() => {
    return [...deadlines]
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 3); // Show only next 3 deadlines
  }, [deadlines]);


  const getDaysUntil = (date: Date) => {
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDeadlineCardStyles = (isOverdue: boolean, isUrgent: boolean): string => {
    if (isOverdue) return 'bg-red-50 border-red-200';
    if (isUrgent) return 'bg-amber-50 border-amber-200';
    return 'bg-[#F5F4F0] border-[#D0C5B2]/20';
  };

  const getDeadlineBadgeStyles = (isOverdue: boolean, isUrgent: boolean): string => {
    if (isOverdue) return 'bg-red-100 text-red-700';
    if (isUrgent) return 'bg-amber-100 text-amber-700';
    return 'bg-blue-100 text-blue-700';
  };

  const getDeadlineText = (daysUntil: number, isOverdue: boolean): string => {
    if (isOverdue) return `${Math.abs(daysUntil)} days overdue`;
    if (daysUntil === 0) return 'Due today';
    return `${daysUntil} days left`;
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <h3 className="text-sm font-medium text-[#6B6A65] mb-3">Upcoming Deadlines</h3>
        <div className="space-y-2">
          <div className="h-16 bg-[#F5F4F0] rounded-lg"></div>
          <div className="h-16 bg-[#F5F4F0] rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (sortedDeadlines.length === 0) {
    return (
      <div>
        <h3 className="text-sm font-medium text-[#6B6A65] mb-3">Upcoming Deadlines</h3>
        <p className="text-sm text-[#6B6A65] italic">No pending deadlines</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-sm font-medium text-[#6B6A65] mb-3">Upcoming Deadlines</h3>
      <div className="space-y-2">
        {sortedDeadlines.map((deadline, index) => {
          const daysUntil = getDaysUntil(deadline.date);
          const isOverdue = daysUntil < 0;
          const isUrgent = daysUntil >= 0 && daysUntil <= 3;

          return (
            <div
              key={deadline.invoiceId || index}
              className={`p-3 rounded-lg border ${getDeadlineCardStyles(isOverdue, isUrgent)}`}
            >
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium text-[#1B1C1A]">{deadline.label}</p>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded ${getDeadlineBadgeStyles(isOverdue, isUrgent)}`}
                >
                  {getDeadlineText(daysUntil, isOverdue)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-[#6B6A65]">
                <span>{formatDate(deadline.date, 'invoice')}</span>
                <span className="font-medium">${deadline.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
