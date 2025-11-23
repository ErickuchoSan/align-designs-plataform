/**
 * Password validation utilities
 * Extracted from validation.utils.ts for better maintainability
 */
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
      length: password.length >= 12,
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

  /**
   * Individual password validators - small, focused, testable
   */
  private static readonly PASSWORD_MIN_LENGTH = 12;
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
    return !password ? 'Password is required' : null;
  }

  private static validatePasswordLength(password: string): string | null {
    return password.length < this.PASSWORD_MIN_LENGTH
      ? `Password must be at least ${this.PASSWORD_MIN_LENGTH} characters long`
      : null;
  }

  private static validatePasswordUppercase(password: string): string | null {
    return !/[A-Z]/.test(password)
      ? 'Password must contain at least one uppercase letter'
      : null;
  }

  private static validatePasswordLowercase(password: string): string | null {
    return !/[a-z]/.test(password)
      ? 'Password must contain at least one lowercase letter'
      : null;
  }

  private static validatePasswordNumber(password: string): string | null {
    return !/\d/.test(password)
      ? 'Password must contain at least one number'
      : null;
  }

  private static validatePasswordSpecialChar(password: string): string | null {
    return !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)
      ? 'Password must contain at least one special character'
      : null;
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
