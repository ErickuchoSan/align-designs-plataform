/**
 * Validation utility functions
 * These must match the backend validation rules
 */

/**
 * Password requirements - MUST match backend validation
 */
export const PASSWORD_REQUIREMENTS = {
  MIN_LENGTH: 12,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBER: true,
  REQUIRE_SYMBOL: true,
} as const;

/**
 * Validate email format using RFC 5322 standard
 * Returns true if email is valid, false otherwise
 */
export function isValidEmail(email: string): boolean {
  // Basic format check
  if (!email || typeof email !== 'string') {
    return false;
  }

  // Trim whitespace
  email = email.trim();

  // RFC 5322 compliant email regex
  // This is a simplified but robust version that covers most valid emails
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  if (!emailRegex.test(email)) {
    return false;
  }

  // Additional validation rules
  const [localPart, domain] = email.split('@');

  // Local part (before @) validations
  if (!localPart || localPart.length > 64) {
    return false;
  }

  // Domain validations
  if (!domain || domain.length > 255) {
    return false;
  }

  // Domain must have at least one dot
  if (!domain.includes('.')) {
    return false;
  }

  // Check for consecutive dots
  if (email.includes('..')) {
    return false;
  }

  // Check for leading/trailing dots
  if (localPart.startsWith('.') || localPart.endsWith('.')) {
    return false;
  }

  return true;
}

/**
 * Get validation error message for invalid email
 */
export function getEmailValidationError(email: string): string | null {
  if (!email || !email.trim()) {
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

  if (PASSWORD_REQUIREMENTS.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
    return {
      isValid: false,
      error: 'Password must contain at least one uppercase letter',
    };
  }

  if (PASSWORD_REQUIREMENTS.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
    return {
      isValid: false,
      error: 'Password must contain at least one lowercase letter',
    };
  }

  if (PASSWORD_REQUIREMENTS.REQUIRE_NUMBER && !/\d/.test(password)) {
    return {
      isValid: false,
      error: 'Password must contain at least one number',
    };
  }

  if (PASSWORD_REQUIREMENTS.REQUIRE_SYMBOL && !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
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
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    symbol: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
  };

  const score = Object.values(requirements).filter(Boolean).length;

  let label = 'Very Weak';
  let color = 'bg-red-500';

  switch (score) {
    case 0:
    case 1:
      label = 'Very Weak';
      color = 'bg-red-500';
      break;
    case 2:
      label = 'Weak';
      color = 'bg-orange-500';
      break;
    case 3:
      label = 'Fair';
      color = 'bg-yellow-500';
      break;
    case 4:
      label = 'Good';
      color = 'bg-blue-500';
      break;
    case 5:
      label = 'Strong';
      color = 'bg-green-500';
      break;
  }

  return { score, label, color, requirements };
}
