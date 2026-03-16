/**
 * Validation utility functions
 * These must match the backend validation rules
 */

import { PASSWORD_REGEX } from '../constants/password-regex.constants';
import { PASSWORD_REQUIREMENTS } from '../constants/validation.constants';

// Re-export PASSWORD_REQUIREMENTS for backward compatibility
export { PASSWORD_REQUIREMENTS };

/**
 * RFC 5322 compliant email regex
 * Simplified but robust version that covers most valid emails
 */
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

/**
 * Validate email local part (before @)
 */
function isValidLocalPart(localPart: string): boolean {
  return Boolean(localPart) &&
         localPart.length <= 64 &&
         !localPart.startsWith('.') &&
         !localPart.endsWith('.');
}

/**
 * Validate email domain part (after @)
 */
function isValidDomain(domain: string): boolean {
  return Boolean(domain) &&
         domain.length <= 255 &&
         domain.includes('.');
}

/**
 * Validate email format using RFC 5322 standard
 * Returns true if email is valid, false otherwise
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;

  const trimmedEmail = email.trim();
  if (!EMAIL_REGEX.test(trimmedEmail)) return false;
  if (trimmedEmail.includes('..')) return false;

  const [localPart, domain] = trimmedEmail.split('@');
  return isValidLocalPart(localPart) && isValidDomain(domain);
}

/**
 * Get validation error message for invalid email
 */
export function getEmailValidationError(email: string): string | null {
  if (!email?.trim()) {
    return 'Email is required';
  }

  if (!isValidEmail(email)) {
    return 'Please enter a valid email address';
  }

  return null;
}

/**
 * Validate password against security requirements
 * MUST match backend validation in backend/src/common/utils/validation.utils.ts
 */
export function validatePassword(password: string): {
  isValid: boolean;
  error?: string;
} {
  if (!password) {
    return { isValid: false, error: 'Password is required' };
  }

  if (password.length < PASSWORD_REQUIREMENTS.MIN_LENGTH) {
    return {
      isValid: false,
      error: `Password must be at least ${PASSWORD_REQUIREMENTS.MIN_LENGTH} characters long`,
    };
  }

  if (PASSWORD_REQUIREMENTS.REQUIRE_UPPERCASE && !PASSWORD_REGEX.UPPERCASE.test(password)) {
    return {
      isValid: false,
      error: 'Password must contain at least one uppercase letter',
    };
  }

  if (PASSWORD_REQUIREMENTS.REQUIRE_LOWERCASE && !PASSWORD_REGEX.LOWERCASE.test(password)) {
    return {
      isValid: false,
      error: 'Password must contain at least one lowercase letter',
    };
  }

  if (PASSWORD_REQUIREMENTS.REQUIRE_NUMBER && !PASSWORD_REGEX.NUMBER.test(password)) {
    return {
      isValid: false,
      error: 'Password must contain at least one number',
    };
  }

  if (PASSWORD_REQUIREMENTS.REQUIRE_SYMBOL && !PASSWORD_REGEX.SPECIAL_CHAR.test(password)) {
    return {
      isValid: false,
      error: 'Password must contain at least one special character',
    };
  }

  return { isValid: true };
}

/**
 * Get password strength score and requirements
 * MUST match backend implementation
 */
export function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
  requirements: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    symbol: boolean;
  };
} {
  const requirements = {
    length: password.length >= PASSWORD_REQUIREMENTS.MIN_LENGTH,
    uppercase: PASSWORD_REGEX.UPPERCASE.test(password),
    lowercase: PASSWORD_REGEX.LOWERCASE.test(password),
    number: PASSWORD_REGEX.NUMBER.test(password),
    symbol: PASSWORD_REGEX.SPECIAL_CHAR.test(password),
  };

  const score = Object.values(requirements).filter(Boolean).length;

  const strengthMap: Record<number, { label: string; color: string }> = {
    0: { label: 'Very Weak', color: 'bg-red-500' },
    1: { label: 'Very Weak', color: 'bg-red-500' },
    2: { label: 'Weak', color: 'bg-orange-500' },
    3: { label: 'Fair', color: 'bg-yellow-500' },
    4: { label: 'Good', color: 'bg-blue-500' },
    5: { label: 'Strong', color: 'bg-green-500' },
  };

  const { label, color } = strengthMap[score] || strengthMap[0];

  return { score, label, color, requirements };
}
