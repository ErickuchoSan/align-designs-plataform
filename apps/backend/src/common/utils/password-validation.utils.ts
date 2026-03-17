/**
 * Password validation utilities
 * Extracted from validation.utils.ts for better maintainability
 */

// Shared regex patterns - used by both strength calculation and validation
const PASSWORD_PATTERNS = {
  UPPERCASE: /[A-Z]/,
  LOWERCASE: /[a-z]/,
  NUMBER: /\d/,
  SPECIAL_CHAR: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/,
} as const;

const PASSWORD_MIN_LENGTH = 12;

const STRENGTH_MAP: Record<number, { label: string; color: string }> = {
  0: { label: 'Very Weak', color: 'bg-red-500' },
  1: { label: 'Very Weak', color: 'bg-red-500' },
  2: { label: 'Weak', color: 'bg-orange-500' },
  3: { label: 'Fair', color: 'bg-yellow-500' },
  4: { label: 'Good', color: 'bg-blue-500' },
  5: { label: 'Strong', color: 'bg-green-500' },
};

export class PasswordValidationUtils {
  /**
   * Password strength calculation
   */
  static calculatePasswordStrength(password: string): {
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
      length: password.length >= PASSWORD_MIN_LENGTH,
      uppercase: PASSWORD_PATTERNS.UPPERCASE.test(password),
      lowercase: PASSWORD_PATTERNS.LOWERCASE.test(password),
      number: PASSWORD_PATTERNS.NUMBER.test(password),
      symbol: PASSWORD_PATTERNS.SPECIAL_CHAR.test(password),
    };

    const score = Object.values(requirements).filter(Boolean).length;
    const { label, color } = STRENGTH_MAP[score] ?? STRENGTH_MAP[0];

    return { score, label, color, requirements };
  }

  /**
   * Individual password validators - small, focused, testable
   */
  private static readonly COMMON_PATTERNS = [
    '123456',
    'password',
    'qwerty',
    'abc123',
    'admin123',
    'welcome123',
  ];
  private static readonly SEQUENTIAL_PATTERNS = [
    'abcdefghijklmnopqrstuvwxyz',
    '0123456789',
  ];

  private static validatePasswordNotEmpty(password: string): string | null {
    return password ? null : 'Password is required';
  }

  private static validatePasswordLength(password: string): string | null {
    return password.length >= PASSWORD_MIN_LENGTH
      ? null
      : `Password must be at least ${PASSWORD_MIN_LENGTH} characters long`;
  }

  private static validatePasswordUppercase(password: string): string | null {
    return PASSWORD_PATTERNS.UPPERCASE.test(password)
      ? null
      : 'Password must contain at least one uppercase letter';
  }

  private static validatePasswordLowercase(password: string): string | null {
    return PASSWORD_PATTERNS.LOWERCASE.test(password)
      ? null
      : 'Password must contain at least one lowercase letter';
  }

  private static validatePasswordNumber(password: string): string | null {
    return PASSWORD_PATTERNS.NUMBER.test(password)
      ? null
      : 'Password must contain at least one number';
  }

  private static validatePasswordSpecialChar(password: string): string | null {
    return PASSWORD_PATTERNS.SPECIAL_CHAR.test(password)
      ? null
      : 'Password must contain at least one special character';
  }

  private static validatePasswordCommonPatterns(
    password: string,
  ): string | null {
    const lowerPassword = password.toLowerCase();
    return this.COMMON_PATTERNS.some((pattern) =>
      lowerPassword.includes(pattern),
    )
      ? 'Password contains common patterns'
      : null;
  }

  private static validatePasswordSequential(password: string): string | null {
    const lowerPassword = password.toLowerCase();
    for (const pattern of this.SEQUENTIAL_PATTERNS) {
      for (let i = 0; i < pattern.length - 2; i++) {
        const substring = pattern.substring(i, i + 3);
        if (lowerPassword.includes(substring)) {
          return 'Password contains sequential characters';
        }
      }
    }
    return null;
  }

  /**
   * Validate password against security requirements
   * Refactored into composable validators for better maintainability
   */
  static validatePassword(password: string): {
    isValid: boolean;
    error?: string;
  } {
    // Array of validators - easy to add/remove/reorder
    const validators = [
      this.validatePasswordNotEmpty,
      this.validatePasswordLength,
      this.validatePasswordUppercase,
      this.validatePasswordLowercase,
      this.validatePasswordNumber,
      this.validatePasswordSpecialChar,
      this.validatePasswordCommonPatterns,
      this.validatePasswordSequential,
    ];

    // Run validators sequentially until one fails
    for (const validator of validators) {
      const error = validator.call(this, password);
      if (error) {
        return { isValid: false, error };
      }
    }

    return { isValid: true };
  }

  /**
   * Check if password contains username or email
   */
  static checkPasswordContainsUserInfo(
    password: string,
    username?: string,
    email?: string,
  ): boolean {
    const passwordLower = password.toLowerCase();

    if (username && passwordLower.includes(username.toLowerCase())) {
      return true;
    }

    if (email) {
      const emailLocal = email.split('@')[0]?.toLowerCase();
      if (emailLocal && passwordLower.includes(emailLocal)) {
        return true;
      }
    }

    return false;
  }
}
