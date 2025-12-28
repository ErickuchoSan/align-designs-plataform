import { InvoiceStatus } from '@/services/invoices.service';

const STATUS_CONFIG: Record<InvoiceStatus, { label: string; color: string; bgColor: string }> = {
    [InvoiceStatus.DRAFT]: { label: 'Draft', color: 'text-gray-700', bgColor: 'bg-gray-100' },
    [InvoiceStatus.SENT]: { label: 'Sent', color: 'text-blue-700', bgColor: 'bg-blue-100' },
    [InvoiceStatus.PAID]: { label: 'Paid', color: 'text-green-700', bgColor: 'bg-green-100' },
    [InvoiceStatus.OVERDUE]: { label: 'Overdue', color: 'text-red-700', bgColor: 'bg-red-100' },
    [InvoiceStatus.CANCELLED]: { label: 'Cancelled', color: 'text-gray-500', bgColor: 'bg-gray-200' },
};

interface InvoiceStatusBadgeProps {
    status: InvoiceStatus;
}

export default function InvoiceStatusBadge({ status }: InvoiceStatusBadgeProps) {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG[InvoiceStatus.DRAFT];

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}>
            {config.label}
        </span>
    );
}
