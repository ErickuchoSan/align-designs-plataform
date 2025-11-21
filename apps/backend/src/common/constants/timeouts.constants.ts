/**
 * Centralized timeout and expiration constants
 * All time values are in milliseconds unless otherwise noted
 */

// OTP Configuration
export const OTP_EXPIRATION_MS = 10 * 60 * 1000; // 10 minutes
export const OTP_EXPIRATION_MINUTES = 10;

// Password Reset Configuration
export const PASSWORD_RESET_EXPIRATION_MS = 24 * 60 * 60 * 1000; // 24 hours
export const PASSWORD_RESET_EXPIRATION_HOURS = 24;

// File Storage Configuration
export const STORAGE_PRESIGNED_URL_EXPIRY_SECONDS = 900; // 15 minutes - reduced from 1 hour for security
export const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024 * 1024; // 15GB
export const MAX_FILE_SIZE_MB = 15000; // 15GB in MB

// Rate Limiting Configuration (ttl in milliseconds)
export const RATE_LIMIT_TTL_MS = 60000; // 1 minute
export const RATE_LIMIT_TTL_5MIN_MS = 5 * 60 * 1000; // 5 minutes

// Rate Limit: Authentication endpoints
export const RATE_LIMIT_AUTH = {
  CHECK_EMAIL: { limit: 2, ttl: RATE_LIMIT_TTL_MS }, // Reduced from 10/min to 2/min to prevent email enumeration
  LOGIN: { limit: 3, ttl: RATE_LIMIT_TTL_5MIN_MS }, // Reduced from 5/1min to 3/5min
  OTP_REQUEST: { limit: 3, ttl: RATE_LIMIT_TTL_MS },
  OTP_VERIFY: { limit: 3, ttl: RATE_LIMIT_TTL_5MIN_MS }, // Reduced from 5/1min to 3/5min
  FORGOT_PASSWORD: { limit: 3, ttl: RATE_LIMIT_TTL_MS },
  RESET_PASSWORD: { limit: 3, ttl: RATE_LIMIT_TTL_5MIN_MS }, // Reduced from 5/1min to 3/5min
};

// Rate Limit: File operations
// Reduced limits to prevent storage exhaustion DoS (3×15GB = 45GB/min max - adjust as needed)
export const RATE_LIMIT_FILES = {
  UPLOAD: { limit: 3, ttl: RATE_LIMIT_TTL_MS }, // 3×15GB = 45GB/min max
  UPDATE: { limit: 3, ttl: RATE_LIMIT_TTL_MS },
  DOWNLOAD: { limit: 5, ttl: RATE_LIMIT_TTL_MS }, // Reduced from 10 to 5/min to prevent bandwidth DoS (5×15GB = 75GB/min max)
  CREATE_COMMENT: { limit: 10, ttl: RATE_LIMIT_TTL_MS },
  DELETE: { limit: 10, ttl: RATE_LIMIT_TTL_MS },
};

// Rate Limit: Project operations
export const RATE_LIMIT_PROJECTS = {
  CREATE: { limit: 10, ttl: RATE_LIMIT_TTL_MS },
  UPDATE: { limit: 20, ttl: RATE_LIMIT_TTL_MS },
  DELETE: { limit: 10, ttl: RATE_LIMIT_TTL_MS },
  LIST: { limit: 100, ttl: RATE_LIMIT_TTL_MS },
  GET: { limit: 100, ttl: RATE_LIMIT_TTL_MS },
};

// Rate Limit: User operations
export const RATE_LIMIT_USERS = {
  CREATE: { limit: 5, ttl: RATE_LIMIT_TTL_MS },
  UPDATE: { limit: 10, ttl: RATE_LIMIT_TTL_MS },
  DELETE: { limit: 5, ttl: RATE_LIMIT_TTL_MS },
  TOGGLE_STATUS: { limit: 10, ttl: RATE_LIMIT_TTL_MS },
  LIST: { limit: 100, ttl: RATE_LIMIT_TTL_MS },
  GET_PROFILE: { limit: 100, ttl: RATE_LIMIT_TTL_MS },
  GET: { limit: 100, ttl: RATE_LIMIT_TTL_MS },
};

// JWT Configuration
export const JWT_DEFAULT_EXPIRATION = '7d';

// Session Configuration
export const SESSION_TIMEOUT_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// OTP Cleanup Configuration
export const OTP_CLEANUP_RETENTION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Transaction Configuration
export const TRANSACTION_TIMEOUT_MS = 30000; // 30 seconds

// Pagination Configuration
export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 10;
export const MAX_LIMIT = 100;

// OTP Generation Configuration
export const OTP_LENGTH = 8;
export const OTP_MIN_VALUE = 10000000; // 8-digit minimum (10^7)
export const OTP_MAX_VALUE = 100000000; // 8-digit maximum (10^8)
export const OTP_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
export const MAX_OTP_PER_WINDOW = 5;
