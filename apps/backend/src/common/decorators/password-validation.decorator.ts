import { applyDecorators } from '@nestjs/common';
import { IsString, MinLength, MaxLength, Matches } from 'class-validator';

/**
 * Composite decorator for password validation
 *
 * Centralizes all password validation rules to avoid duplication across DTOs.
 * Password requirements:
 * - Minimum 12 characters
 * - Maximum 128 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 *
 * @param options - Optional configuration for custom messages
 * @param options.fieldName - Custom field name for error messages (default: 'Password')
 *
 * @example
 * ```typescript
 * export class ChangePasswordDto {
 *   @ValidatePassword({ fieldName: 'Current password' })
 *   currentPassword: string;
 *
 *   @ValidatePassword({ fieldName: 'New password' })
 *   newPassword: string;
 * }
 * ```
 */
export function ValidatePassword(options?: { fieldName?: string }) {
  const fieldName = options?.fieldName || 'Password';

  return applyDecorators(
    IsString({ message: `${fieldName} must be a string` }),
    MinLength(12, {
      message: `${fieldName} must be at least 12 characters long`,
    }),
    MaxLength(128, {
      message: `${fieldName} cannot exceed 128 characters`,
    }),
    Matches(/[A-Z]/, {
      message: `${fieldName} must contain at least one uppercase letter`,
    }),
    Matches(/[a-z]/, {
      message: `${fieldName} must contain at least one lowercase letter`,
    }),
    Matches(/\d/, {
      message: `${fieldName} must contain at least one number`,
    }),
    Matches(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/, {
      message: `${fieldName} must contain at least one special character`,
    }),
  );
}

/**
 * Simplified validator for password confirmation fields
 *
 * Used for confirmPassword fields that only need basic validation
 * (length requirements but not complexity requirements, as they
 * should match the main password).
 *
 * @param options - Optional configuration
 * @param options.fieldName - Custom field name for error messages (default: 'Password confirmation')
 *
 * @example
 * ```typescript
 * export class SetPasswordDto {
 *   @ValidatePassword()
 *   password: string;
 *
 *   @ValidatePasswordConfirmation()
 *   confirmPassword: string;
 * }
 * ```
 */
export function ValidatePasswordConfirmation(options?: { fieldName?: string }) {
  const fieldName = options?.fieldName || 'Password confirmation';

  return applyDecorators(
    IsString({ message: `${fieldName} must be a string` }),
    MinLength(12, {
      message: `${fieldName} must be at least 12 characters long`,
    }),
    MaxLength(128, {
      message: `${fieldName} cannot exceed 128 characters`,
    }),
  );
}
