import { InvoiceStatus } from '@/types/invoice';
import { EmployeePaymentStatus } from '@/types/employee-payment';
import type { BadgeColor } from '@/lib/styles';

/**
 * Centralized status color definitions (SSOT)
 *
 * Use these functions to get consistent status colors across the app.
 * This eliminates duplicate getStatusColor functions scattered in components.
 */

// Invoice Status Colors
export const INVOICE_STATUS_COLORS: Record<InvoiceStatus, BadgeColor> = {
  [InvoiceStatus.DRAFT]: 'gray',
  [InvoiceStatus.SENT]: 'blue',
  [InvoiceStatus.PAID]: 'green',
  [InvoiceStatus.OVERDUE]: 'red',
  [InvoiceStatus.CANCELLED]: 'gray',
};

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  [InvoiceStatus.DRAFT]: 'Draft',
  [InvoiceStatus.SENT]: 'Sent',
  [InvoiceStatus.PAID]: 'Paid',
  [InvoiceStatus.OVERDUE]: 'Overdue',
  [InvoiceStatus.CANCELLED]: 'Cancelled',
};

// Employee Payment Status Colors
export const EMPLOYEE_PAYMENT_STATUS_COLORS: Record<EmployeePaymentStatus, BadgeColor> = {
  [EmployeePaymentStatus.PENDING]: 'yellow',
  [EmployeePaymentStatus.APPROVED]: 'green',
  [EmployeePaymentStatus.REJECTED]: 'red',
  [EmployeePaymentStatus.CANCELLED]: 'gray',
};

export const EMPLOYEE_PAYMENT_STATUS_LABELS: Record<EmployeePaymentStatus, string> = {
  [EmployeePaymentStatus.PENDING]: 'Pending',
  [EmployeePaymentStatus.APPROVED]: 'Approved',
  [EmployeePaymentStatus.REJECTED]: 'Rejected',
  [EmployeePaymentStatus.CANCELLED]: 'Cancelled',
};

// Client Payment Status
export type ClientPaymentStatus = 'PENDING_APPROVAL' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED';

export const CLIENT_PAYMENT_STATUS_COLORS: Record<ClientPaymentStatus, BadgeColor> = {
  PENDING_APPROVAL: 'yellow',
  CONFIRMED: 'green',
  REJECTED: 'red',
  CANCELLED: 'gray',
};

export const CLIENT_PAYMENT_STATUS_LABELS: Record<ClientPaymentStatus, string> = {
  PENDING_APPROVAL: 'Pending Approval',
  CONFIRMED: 'Confirmed',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
};

// Tailwind class mappings for legacy components not using Badge
export const STATUS_CLASS_MAP: Record<string, string> = {
  // Success states
  PAID: 'bg-green-100 text-green-800',
  APPROVED: 'bg-green-100 text-green-800',
  CONFIRMED: 'bg-green-100 text-green-800',
  ACTIVE: 'bg-green-100 text-green-800',

  // Warning states
  PENDING: 'bg-yellow-100 text-yellow-800',
  PENDING_APPROVAL: 'bg-yellow-100 text-yellow-800',
  SENT: 'bg-yellow-100 text-yellow-800',
  DRAFT: 'bg-yellow-100 text-yellow-800',
  WAITING_PAYMENT: 'bg-yellow-100 text-yellow-800',

  // Error states
  OVERDUE: 'bg-red-100 text-red-800',
  REJECTED: 'bg-red-100 text-red-800',

  // Neutral states
  CANCELLED: 'bg-gray-100 text-gray-800',
  ARCHIVED: 'bg-gray-100 text-gray-800',
  COMPLETED: 'bg-blue-100 text-blue-800',
};

/**
 * Get Tailwind classes for any status string
 * Fallback to neutral if status not found
 */
export function getStatusClasses(status: string): string {
  return STATUS_CLASS_MAP[status] || 'bg-stone-100 text-stone-800';
}

/**
 * Get combined status color for Invoice or Employee Payment
 * Used in components that handle both types
 */
export function getPaymentStatusColor(status: InvoiceStatus | EmployeePaymentStatus): string {
  return getStatusClasses(status);
}
