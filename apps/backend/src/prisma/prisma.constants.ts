/**
 * Prisma database configuration constants
 * Centralized configuration for database monitoring and performance thresholds
 */

/**
 * Threshold for logging slow database queries in milliseconds
 * Queries exceeding this duration will be logged as warnings
 * 1000ms = 1 second
 */
export const SLOW_QUERY_THRESHOLD_MS = 1000;
