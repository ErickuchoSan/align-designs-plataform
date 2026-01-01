/**
 * Date formatting utilities for consistent timestamp display
 * Optimized with cached Intl.DateTimeFormat instances
 */

import { logger } from '../logger';

export const DATE_FORMATS = {
  SHORT: { day: '2-digit', month: 'short', year: 'numeric' } as const,
  LONG: { day: '2-digit', month: 'long', year: 'numeric' } as const,
  NUMERIC: { day: '2-digit', month: '2-digit', year: 'numeric' } as const,
  WITH_TIME: {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  } as const,
};

export const DEFAULT_LOCALE = 'en-US';

/**
 * Cached Date Formatters
 * Stores Intl.DateTimeFormat instances to avoid recreation on every call
 * Significantly improves performance when formatting many dates
 */
const dateFormatters = new Map<string, Intl.DateTimeFormat>();

/**
 * Get or create a cached date formatter
 */
function getFormatter(format: keyof typeof DATE_FORMATS, locale: string): Intl.DateTimeFormat {
  const key = `${locale}-${format}`;

  if (!dateFormatters.has(key)) {
    dateFormatters.set(key, new Intl.DateTimeFormat(locale, DATE_FORMATS[format]));
  }

  return dateFormatters.get(key)!;
}

/**
 * Formats a date with a consistent format using cached formatters
 * @param date - Date string or Date object
 * @param format - Format to use (default: SHORT)
 * @param locale - Locale to use (default: en-US)
 */
export function formatDate(
  date: string | Date,
  format: keyof typeof DATE_FORMATS = 'SHORT',
  locale: string = DEFAULT_LOCALE
): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return getFormatter(format, locale).format(dateObj);
  } catch (error) {
    logger.error('Error formatting date:', error);
    return 'Invalid date';
  }
}

/**
 * Formats a date with time
 * @param date - Date string or Date object
 * @param locale - Locale to use (default: en-US)
 */
export function formatDateTime(
  date: string | Date,
  locale: string = DEFAULT_LOCALE
): string {
  return formatDate(date, 'WITH_TIME', locale);
}

/**
 * Formats a relative time (e.g., "2 hours ago")
 * @param date - Date string or Date object
 */
export function formatRelativeTime(date: string | Date): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - dateObj.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) {
      return 'just now';
    } else if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      return formatDate(dateObj);
    }
  } catch (error) {
    logger.error('Error formatting relative time:', error);
    return 'Invalid date';
  }
}
