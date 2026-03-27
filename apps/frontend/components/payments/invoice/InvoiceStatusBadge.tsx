'use client';

import { memo } from 'react';
import { InvoiceStatus } from '@/types/invoice';

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus;
  className?: string;
}

const STATUS_CLASSES: Record<InvoiceStatus, string> = {
  [InvoiceStatus.DRAFT]: 'bg-gray-100 text-gray-800',
  [InvoiceStatus.SENT]: 'bg-blue-100 text-blue-800',
  [InvoiceStatus.PAID]: 'bg-green-100 text-green-800',
  [InvoiceStatus.OVERDUE]: 'bg-red-100 text-red-800',
  [InvoiceStatus.CANCELLED]: 'bg-[#F5F4F0] text-[#6B6A65]',
};

function InvoiceStatusBadge({ status, className = '' }: Readonly<InvoiceStatusBadgeProps>) {
  const statusClass = STATUS_CLASSES[status] || 'bg-gray-100 text-gray-800';

  return (
    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass} ${className}`}>
      {status}
    </span>
  );
}

export default memo(InvoiceStatusBadge);
