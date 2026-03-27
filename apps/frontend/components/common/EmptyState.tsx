'use client';

import { memo, ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

function EmptyState({
  icon,
  title,
  description,
  action,
  className = '',
}: Readonly<EmptyStateProps>) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
      {icon && (
        <div className="mb-4 text-[#6B6A65]" aria-hidden="true">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-medium text-[#1B1C1A] mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-[#6B6A65] max-w-sm mb-4">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export default memo(EmptyState);
