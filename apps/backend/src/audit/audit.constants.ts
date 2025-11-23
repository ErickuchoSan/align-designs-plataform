/**
 * Audit service configuration constants
 * Centralized configuration for audit log querying and pagination
 */

/**
 * Default maximum number of audit log entries to return in queries
 * Used as default limit for findByUser, findByResource, and findByAction methods
 */
export const DEFAULT_AUDIT_LOG_LIMIT = 100;
