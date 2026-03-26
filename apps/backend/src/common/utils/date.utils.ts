import {
  format,
  formatDistanceToNow,
  parseISO,
  isValid,
  addDays,
  subDays,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  startOfDay,
  endOfDay,
} from 'date-fns';

export const DATE_FORMATS = {
  display: 'MMM dd, yyyy',
  displayWithTime: 'MMM dd, yyyy HH:mm',
  api: "yyyy-MM-dd'T'HH:mm:ss'Z'",
  invoice: 'MMMM d, yyyy',
  log: 'yyyy-MM-dd HH:mm:ss',
} as const;

type DateInput = Date | string | null | undefined;

/**
 * Format a date with the specified format
 */
export function formatDate(
  date: DateInput,
  formatStr: keyof typeof DATE_FORMATS | string = 'display',
): string {
  if (!date) return '-';

  const dateObj = typeof date === 'string' ? parseISO(date) : date;

  if (!isValid(dateObj)) return 'Invalid date';

  const formatString =
    DATE_FORMATS[formatStr as keyof typeof DATE_FORMATS] ?? formatStr;

  return format(dateObj, formatString);
}

/**
 * Format a date as relative time
 */
export function formatRelative(date: DateInput): string {
  if (!date) return '-';

  const dateObj = typeof date === 'string' ? parseISO(date) : date;

  if (!isValid(dateObj)) return 'Invalid date';

  return formatDistanceToNow(dateObj, { addSuffix: true });
}

/**
 * Calculate invoice due date (30 days from issue)
 */
export function calculateDueDate(issueDate: Date = new Date()): Date {
  return addDays(issueDate, 30);
}

/**
 * Check if a date is overdue
 */
export function isOverdue(date: DateInput): boolean {
  if (!date) return false;

  const dateObj = typeof date === 'string' ? parseISO(date) : date;

  if (!isValid(dateObj)) return false;

  return dateObj < new Date();
}

/**
 * Get days until a date
 */
export function getDaysUntil(date: DateInput): number | null {
  if (!date) return null;

  const dateObj = typeof date === 'string' ? parseISO(date) : date;

  if (!isValid(dateObj)) return null;

  return differenceInDays(dateObj, new Date());
}

/**
 * Parse an ISO string to Date safely
 */
export function parseDateSafe(dateString: string): Date | null {
  const date = parseISO(dateString);
  return isValid(date) ? date : null;
}

// Re-export commonly used functions
export {
  format,
  parseISO,
  isValid,
  addDays,
  subDays,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  startOfDay,
  endOfDay,
};