/**
 * Password validation regex patterns
 * Centralized to avoid duplication across validators and decorators
 */

export const PASSWORD_REGEX = {
  /**
   * At least one uppercase letter (A-Z)
   */
  UPPERCASE: /[A-Z]/,

  /**
   * At least one lowercase letter (a-z)
   */
  LOWERCASE: /[a-z]/,

  /**
   * At least one number (0-9)
   */
  NUMBER: /\d/,

  /**
   * At least one special character
   * Includes: !@#$%^&*()_+-=[]{};':"\\|,.<>/?
   */
  SPECIAL_CHAR: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/,
} as const;
