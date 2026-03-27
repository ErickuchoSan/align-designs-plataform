'use client';

import { memo } from 'react';

interface ToggleSwitchProps {
  isActive: boolean;
  disabled?: boolean;
  onToggle: () => void;
  ariaLabel: string;
  size?: 'sm' | 'md';
}

/**
 * Reusable toggle switch component
 * Used for activating/deactivating users, settings, etc.
 */
function ToggleSwitch({
  isActive,
  disabled = false,
  onToggle,
  ariaLabel,
  size = 'md',
}: Readonly<ToggleSwitchProps>) {
  const sizeClasses = {
    sm: { track: 'h-5 w-9', thumb: 'h-3 w-3', activePos: 'translate-x-5', inactivePos: 'translate-x-1' },
    md: { track: 'h-6 w-11', thumb: 'h-4 w-4', activePos: 'translate-x-6', inactivePos: 'translate-x-1' },
  };

  const { track, thumb, activePos, inactivePos } = sizeClasses[size];

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={`relative inline-flex ${track} items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#C9A84C] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${isActive ? 'bg-[#C9A84C]' : 'bg-[#D0C5B2]'}`}
      aria-label={ariaLabel}
      role="switch"
      aria-checked={isActive}
    >
      <span
        className={`inline-block ${thumb} transform rounded-full bg-white transition-transform ${isActive ? activePos : inactivePos}`}
      />
    </button>
  );
}

export default memo(ToggleSwitch);
