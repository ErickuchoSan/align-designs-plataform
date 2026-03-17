/**
 * Validation constants
 * Centralized validation rules - MUST match backend constants
 */

/**
 * Password validation constraints
 * MUST match backend PASSWORD_CONSTRAINTS
 */
export const PASSWORD_CONSTRAINTS = {
  MIN_LENGTH: 12,
  MAX_LENGTH: 128,
} as const;

/**
 * Password requirements configuration
 * MUST match backend validation rules
 */
export const PASSWORD_REQUIREMENTS = {
  MIN_LENGTH: PASSWORD_CONSTRAINTS.MIN_LENGTH,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBER: true,
  REQUIRE_SYMBOL: true,
} as const;

/**
 * Email validation constants
 * MUST match backend EmailValidationUtils
 */
export const EMAIL_CONSTRAINTS = {
  LOCAL_PART_MAX_LENGTH: 64,
  DOMAIN_MAX_LENGTH: 255,
  TLD_MIN_LENGTH: 2,
  TLD_MAX_LENGTH: 6,
} as const;

export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
export const LOCAL_PART_REGEX = /^[a-zA-Z0-9._%+-]+$/;

export const SUSPICIOUS_EMAIL_DOMAINS = [
  'tempmail.com',
  '10minutemail.com',
  'guerrillamail.com',
  'mailinator.com',
] as const;

export const BUSINESS_EMAIL_DOMAINS = new Set([
  'microsoft.com',
  'google.com',
  'apple.com',
  'amazon.com',
  'meta.com',
  'linkedin.com',
  'twitter.com',
  'facebook.com',
  'instagram.com',
  'whatsapp.com',
]);
