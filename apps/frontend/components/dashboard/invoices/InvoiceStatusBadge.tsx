import { memo } from 'react';
import { InvoiceStatus } from '@/types/invoice';
import { Badge } from '@/components/ui/Badge';
import type { BadgeColor } from '@/lib/styles';

const STATUS_CONFIG: Record<InvoiceStatus, { label: string; color: BadgeColor }> = {
  [InvoiceStatus.DRAFT]: { label: 'Draft', color: 'gray' },
  [InvoiceStatus.SENT]: { label: 'Sent', color: 'blue' },
  [InvoiceStatus.PAID]: { label: 'Paid', color: 'green' },
  [InvoiceStatus.OVERDUE]: { label: 'Overdue', color: 'red' },
  [InvoiceStatus.CANCELLED]: { label: 'Cancelled', color: 'gray' },
};

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus;
}

export default memo(function InvoiceStatusBadge({ status }: InvoiceStatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG[InvoiceStatus.DRAFT];

  return <Badge color={config.color}>{config.label}</Badge>;
});
