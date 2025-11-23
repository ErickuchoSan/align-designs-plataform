/**
 * Health check configuration constants
 * Centralized configuration for health endpoint rate limiting and monitoring
 */

/**
 * Rate limit for health check endpoint
 * Prevents reconnaissance attacks while allowing monitoring systems to poll
 */
export const HEALTH_CHECK_RATE_LIMIT = 10;

/**
 * Time window for health check rate limit in milliseconds
 * 60000ms = 1 minute
 */
export const HEALTH_CHECK_RATE_WINDOW_MS = 60000;
