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
