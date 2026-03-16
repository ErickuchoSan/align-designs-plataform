/**
 * Date Formatting Utilities
 * Centralized date formatting functions to ensure consistency across the app
 */

/**
 * Format date to localized long format
 * @example "January 15, 2024"
 */
export function formatDateLong(dateString: string | Date, locale: string = 'en-US'): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format date to short format
 * @example "01/15/2024"
 */
export function formatDateShort(dateString: string | Date, locale: string = 'en-US'): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return date.toLocaleDateString(locale);
}

/**
 * Format date with time
 * @example "January 15, 2024 at 3:45 PM"
 */
export function formatDateTime(dateString: string | Date, locale: string = 'en-US'): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  const dateStr = date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const timeStr = date.toLocaleTimeString(locale, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return `${dateStr} at ${timeStr}`;
}

/**
 * Helper to pluralize time units
 */
function pluralize(value: number, unit: string): string {
  return `${value} ${unit}${value !== 1 ? 's' : ''}`;
}

/**
 * Format relative time value with proper unit
 */
function formatRelativeValue(days: number, hours: number, minutes: number): string {
  if (days > 0) return pluralize(days, 'day');
  if (hours > 0) return pluralize(hours, 'hour');
  if (minutes > 0) return pluralize(minutes, 'minute');
  return '';
}

/**
 * Get relative time string
 * @example "2 hours ago", "in 3 days"
 */
export function getRelativeTime(dateString: string | Date, _locale: string = 'en-US'): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.round(diffMs / (1000 * 60));

  // Future dates
  if (diffMs > 0) {
    const formatted = formatRelativeValue(diffDays, diffHours, diffMinutes);
    return formatted ? `in ${formatted}` : 'in a moment';
  }

  // Past dates
  const formatted = formatRelativeValue(Math.abs(diffDays), Math.abs(diffHours), Math.abs(diffMinutes));
  return formatted ? `${formatted} ago` : 'just now';
}

/**
 * Get days until a date
 * @returns positive number for future, negative for past
 */
export function getDaysUntil(dateString: string | Date): number {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Check if date is overdue (past current date)
 */
export function isOverdue(dateString: string | Date): boolean {
  return getDaysUntil(dateString) < 0;
}

/**
 * Check if date is urgent (within specified days)
 */
export function isUrgent(dateString: string | Date, urgentDays: number = 3): boolean {
  const daysUntil = getDaysUntil(dateString);
  return daysUntil >= 0 && daysUntil <= urgentDays;
}

/**
 * Format date for input[type="date"] (YYYY-MM-DD)
 */
export function formatDateForInput(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return date.toISOString().split('T')[0];
}

/**
 * Get today's date formatted for input[type="date"] (YYYY-MM-DD)
 * DRY: Replaces repeated `new Date().toISOString().split('T')[0]` pattern
 */
export function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get formatted deadline status text
 */
export function getDeadlineStatus(dateString: string | Date): {
  text: string;
  variant: 'overdue' | 'urgent' | 'normal';
} {
  const daysUntil = getDaysUntil(dateString);

  if (daysUntil < 0) {
    return {
      text: `${Math.abs(daysUntil)} days overdue`,
      variant: 'overdue',
    };
  }

  if (daysUntil === 0) {
    return {
      text: 'Due today',
      variant: 'urgent',
    };
  }

  if (daysUntil <= 3) {
    return {
      text: `${daysUntil} days left`,
      variant: 'urgent',
    };
  }

  return {
    text: `${daysUntil} days left`,
    variant: 'normal',
  };
}
