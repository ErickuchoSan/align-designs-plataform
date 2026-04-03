'use client';

import { memo, useMemo } from 'react';
import { StageInfo } from '@/types/stage';

interface StageCardProps {
  stage: StageInfo;
  isActive: boolean;
  onClick: () => void;
}

/**
 * StageCard Component
 *
 * Displays a stage as a clickable card showing:
 * - Stage icon and name
 * - File count
 * - Permission badge
 * - Active state
 *
 * Optimized with memoization (rendered in loop within ProjectStagesView)
 */
function StageCard({ stage, isActive, onClick }: Readonly<StageCardProps>) {
  // Memoize permission badge to prevent recreation on every render
  const permissionBadge = useMemo(() => {
    if (stage.permissions.canWrite) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
          Read + Write
        </span>
      );
    } else if (stage.permissions.canView) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
          Read Only
        </span>
      );
    }
    return null;
  }, [stage.permissions.canWrite, stage.permissions.canView]);

  return (
    <button
      onClick={onClick}
      className={`
        w-full text-left p-4 rounded-xl border-2 transition-all duration-200
        ${
          isActive
            ? 'border-[#C9A84C] bg-[#F5F4F0] scale-105'
            : 'border-[#D0C5B2]/20 bg-white hover:border-[#C9A84C]/50'
        }
      `}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="text-2xl">{stage.icon}</div>
        {permissionBadge}
      </div>

      <h3
        className="font-semibold text-sm mb-1 text-[#1B1C1A]"
      >
        {stage.name}
      </h3>

      <div className="flex items-center justify-between">
        <span className="text-xs text-[#6B6A65]">
          {stage.fileCount} {stage.fileCount === 1 ? 'file' : 'files'}
        </span>
        {isActive && (
          <svg
            className="w-4 h-4 text-[#C9A84C]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        )}
      </div>
    </button>
  );
}

// Memoize component to prevent re-renders when rendered in loops
// Only re-renders when stage data, isActive, or onClick change
export default memo(StageCard);
