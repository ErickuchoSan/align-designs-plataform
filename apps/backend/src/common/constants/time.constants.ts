/**
 * Time-related constants
 * Centralized to avoid magic numbers throughout the codebase
 */

// Milliseconds conversions
export const MS_PER_SECOND = 1000;
export const MS_PER_MINUTE = 60 * MS_PER_SECOND;
export const MS_PER_HOUR = 60 * MS_PER_MINUTE;
export const MS_PER_DAY = 24 * MS_PER_HOUR;

// Common time durations in milliseconds
export const ONE_DAY_MS = MS_PER_DAY;
export const ONE_HOUR_MS = MS_PER_HOUR;
export const ONE_MINUTE_MS = MS_PER_MINUTE;
export const ONE_SECOND_MS = MS_PER_SECOND;

// Cookie expiration times (in milliseconds)
export const COOKIE_MAX_AGE_ONE_DAY = ONE_DAY_MS;
export const COOKIE_MAX_AGE_SEVEN_DAYS = 7 * ONE_DAY_MS;
export const COOKIE_MAX_AGE_THIRTY_DAYS = 30 * ONE_DAY_MS;

// Response delays
export const MIN_RESPONSE_DELAY_MS = 100; // Minimum delay to prevent timing attacks
export const DEFAULT_RESPONSE_DELAY_MS = 500;

// Retry delays
export const RETRY_DELAY_SHORT_MS = 100;
export const RETRY_DELAY_MEDIUM_MS = 500;
export const RETRY_DELAY_LONG_MS = 1000;
