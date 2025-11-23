/**
 * Validation constants
 * Centralized validation rules to avoid duplication and ensure consistency
 */

/**
 * Password validation constraints
 */
export const PASSWORD_CONSTRAINTS = {
  MIN_LENGTH: 12,
  MAX_LENGTH: 128,
} as const;

/**
 * Name field validation constraints
 */
export const NAME_CONSTRAINTS = {
  MIN_LENGTH: 1,
  MAX_LENGTH: 50,
} as const;

/**
 * Email validation constraints
 * Based on RFC 5321 specification
 */
export const EMAIL_CONSTRAINTS = {
  MIN_LENGTH: 5, // Shortest valid email: a@b.c
  MAX_LENGTH: 320, // RFC 5321: 64 (local) + 1 (@) + 255 (domain)
} as const;

/**
 * Project name validation constraints
 */
export const PROJECT_NAME_CONSTRAINTS = {
  MIN_LENGTH: 1,
  MAX_LENGTH: 255,
} as const;

/**
 * Project description validation constraints
 */
export const PROJECT_DESCRIPTION_CONSTRAINTS = {
  MAX_LENGTH: 5000,
} as const;

/**
 * Comment validation constraints
 */
export const COMMENT_CONSTRAINTS = {
  MAX_LENGTH: 2000,
} as const;

/**
 * Phone number validation constraints
 */
export const PHONE_CONSTRAINTS = {
  NUMBER_LENGTH: 10,
  COUNTRY_CODE_MIN_LENGTH: 1,
  COUNTRY_CODE_MAX_LENGTH: 3,
} as const;
