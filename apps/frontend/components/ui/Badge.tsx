'use client';

import { cn, BADGE_BASE, BADGE_VARIANTS, BADGE_COLORS, type BadgeVariant, type BadgeColor } from '@/lib/styles';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  color?: BadgeColor;
  withBorder?: boolean;
  className?: string;
}

export function Badge({
  children,
  variant = 'default',
  color = 'gray',
  withBorder = false,
  className,
}: Readonly<BadgeProps>) {
  return (
    <span
      className={cn(BADGE_BASE, BADGE_VARIANTS[variant], BADGE_COLORS[color], withBorder && 'border', className)}
    >
      {children}
    </span>
  );
}
