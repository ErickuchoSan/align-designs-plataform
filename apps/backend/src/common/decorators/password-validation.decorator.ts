import { applyDecorators } from '@nestjs/common';
import { IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { PASSWORD_REGEX } from '../constants/password-regex.constants';
import { PASSWORD_CONSTRAINTS } from '../constants/validation.constants';

/**
 * Composite decorator for password validation
 *
 * Centralizes all password validation rules to avoid duplication across DTOs.
 * Password requirements:
 * - Minimum ${PASSWORD_CONSTRAINTS.MIN_LENGTH} characters
 * - Maximum ${PASSWORD_CONSTRAINTS.MAX_LENGTH} characters
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
    MinLength(PASSWORD_CONSTRAINTS.MIN_LENGTH, {
      message: `${fieldName} must be at least ${PASSWORD_CONSTRAINTS.MIN_LENGTH} characters long`,
    }),
    MaxLength(PASSWORD_CONSTRAINTS.MAX_LENGTH, {
      message: `${fieldName} cannot exceed ${PASSWORD_CONSTRAINTS.MAX_LENGTH} characters`,
    }),
    Matches(PASSWORD_REGEX.UPPERCASE, {
      message: `${fieldName} must contain at least one uppercase letter`,
    }),
    Matches(PASSWORD_REGEX.LOWERCASE, {
      message: `${fieldName} must contain at least one lowercase letter`,
    }),
    Matches(PASSWORD_REGEX.NUMBER, {
      message: `${fieldName} must contain at least one number`,
    }),
    Matches(PASSWORD_REGEX.SPECIAL_CHAR, {
      message: `${fieldName} must contain at least one special character`,
    }),
  );
}

/**
 * Simple validator for current password fields
 *
 * Used for currentPassword fields that only need to verify the password
 * is provided (no complexity validation, as it's already set).
 *
 * @param options - Optional configuration
 * @param options.fieldName - Custom field name for error messages (default: 'Current password')
 *
 * @example
 * ```typescript
 * export class ChangePasswordDto {
 *   @ValidateCurrentPassword()
 *   currentPassword: string;
 *
 *   @ValidatePassword()
 *   newPassword: string;
 * }
 * ```
 */
export function ValidateCurrentPassword(options?: { fieldName?: string }) {
  const fieldName = options?.fieldName || 'Current password';

  return applyDecorators(
    IsString({ message: `${fieldName} must be a string` }),
    MinLength(1, {
      message: `${fieldName} is required`,
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
    MinLength(PASSWORD_CONSTRAINTS.MIN_LENGTH, {
      message: `${fieldName} must be at least ${PASSWORD_CONSTRAINTS.MIN_LENGTH} characters long`,
    }),
    MaxLength(PASSWORD_CONSTRAINTS.MAX_LENGTH, {
      message: `${fieldName} cannot exceed ${PASSWORD_CONSTRAINTS.MAX_LENGTH} characters`,
    }),
  );
}
