import {
  format,
  formatDistanceToNow,
  parseISO,
  isValid,
  isPast,
  differenceInDays,
  addDays,
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  subDays,
  subMonths,
} from 'date-fns';
import { enUS } from 'date-fns/locale';

export const DATE_FORMATS = {
  display: 'MMM dd, yyyy',
  displayWithTime: 'MMM dd, yyyy h:mm a',
  input: 'yyyy-MM-dd',
  api: "yyyy-MM-dd'T'HH:mm:ss'Z'",
  invoice: 'MMMM d, yyyy',
  short: 'MM/dd/yyyy',
  time: 'h:mm a',
  full: 'EEEE, MMMM d, yyyy',
} as const;

type DateInput = Date | string | null | undefined;

/**
 * Format a date with the specified format
 */
export function formatDate(
  date: DateInput,
  formatStr: keyof typeof DATE_FORMATS = 'display'
): string {
  if (!date) return '-';

  const dateObj = typeof date === 'string' ? parseISO(date) : date;

  if (!isValid(dateObj)) return 'Invalid date';

  return format(dateObj, DATE_FORMATS[formatStr], { locale: enUS });
}

/**
 * Format a date as relative time (e.g., "2 hours ago")
 */
export function formatRelative(date: DateInput): string {
  if (!date) return '-';

  const dateObj = typeof date === 'string' ? parseISO(date) : date;

  if (!isValid(dateObj)) return 'Invalid date';

  return formatDistanceToNow(dateObj, { addSuffix: true, locale: enUS });
}

/**
 * Get due date status with color and label
 */
export function getDueDateStatus(dueDate: DateInput): {
  status: 'overdue' | 'urgent' | 'upcoming' | 'normal';
  label: string;
  color: 'red' | 'orange' | 'yellow' | 'gray';
} {
  if (!dueDate) {
    return { status: 'normal', label: 'No due date', color: 'gray' };
  }

  const dateObj = typeof dueDate === 'string' ? parseISO(dueDate) : dueDate;

  if (!isValid(dateObj)) {
    return { status: 'normal', label: 'Invalid date', color: 'gray' };
  }

  const today = new Date();
  const daysUntilDue = differenceInDays(dateObj, today);

  if (isPast(dateObj) && daysUntilDue < 0) {
    return { status: 'overdue', label: 'Overdue', color: 'red' };
  }

  if (daysUntilDue <= 3) {
    return { status: 'urgent', label: 'Due Soon', color: 'orange' };
  }

  if (daysUntilDue <= 7) {
    return { status: 'upcoming', label: 'This Week', color: 'yellow' };
  }

  return {
    status: 'normal',
    label: format(dateObj, 'MMM d'),
    color: 'gray',
  };
}

/**
 * Get date range presets for filters
 */
export function getDateRange(
  preset: 'today' | 'yesterday' | 'thisWeek' | 'thisMonth' | 'last30Days' | 'last3Months'
): { start: Date; end: Date } | null {
  const now = new Date();

  switch (preset) {
    case 'today':
      return { start: startOfDay(now), end: endOfDay(now) };
    case 'yesterday':
      return {
        start: startOfDay(subDays(now, 1)),
        end: endOfDay(subDays(now, 1)),
      };
    case 'thisWeek':
      return { start: subDays(now, 7), end: now };
    case 'thisMonth':
      return { start: startOfMonth(now), end: endOfMonth(now) };
    case 'last30Days':
      return { start: subDays(now, 30), end: now };
    case 'last3Months':
      return { start: subMonths(now, 3), end: now };
    default:
      return null;
  }
}

/**
 * Create invoice dates (issue date + due date 30 days later)
 */
export function createInvoiceDates(issueDate: Date = new Date()) {
  return {
    issueDate: format(issueDate, DATE_FORMATS.invoice),
    issueDateISO: issueDate,
    dueDate: format(addDays(issueDate, 30), DATE_FORMATS.invoice),
    dueDateISO: addDays(issueDate, 30),
  };
}

/**
 * Check if a date is valid
 */
export function isValidDate(date: DateInput): boolean {
  if (!date) return false;
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return isValid(dateObj);
}

/**
 * Parse an ISO string to Date
 */
export function parseDateString(dateString: string): Date | null {
  const date = parseISO(dateString);
  return isValid(date) ? date : null;
}

/**
 * Get today's date formatted for input[type="date"] (YYYY-MM-DD)
 * Replaces: new Date().toISOString().split('T')[0]
 */
export function getTodayDateString(): string {
  return format(new Date(), DATE_FORMATS.input);
}

/**
 * Format any date for input[type="date"] (YYYY-MM-DD)
 * Replaces: date.toISOString().split('T')[0]
 */
export function formatDateForInput(date: DateInput): string {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(dateObj)) return '';
  return format(dateObj, DATE_FORMATS.input);
}

/**
 * Format a date with time (e.g., "Mar 25, 2026 3:45 PM")
 * Replaces: date.toLocaleString()
 */
export function formatDateTime(date: DateInput): string {
  if (!date) return '-';
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(dateObj)) return 'Invalid date';
  return format(dateObj, DATE_FORMATS.displayWithTime, { locale: enUS });
}

// Re-export commonly used functions from date-fns
export {
  format,
  formatDistanceToNow,
  parseISO,
  isValid,
  isPast,
  isFuture,
  differenceInDays,
  addDays,
  subDays,
} from 'date-fns';