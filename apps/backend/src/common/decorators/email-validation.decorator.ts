import { applyDecorators } from '@nestjs/common';
import { IsEmail, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * Composite decorator for email validation
 * Validates email format and applies transformations
 *
 * Combines:
 * - IsEmail validation with custom error message
 * - Transform to lowercase and trim whitespace
 *
 * @param options - Customization options
 * @param options.message - Custom error message (default: 'Invalid email address')
 * @param options.required - Whether email is required (default: true)
 *
 * @example
 * export class LoginDto {
 *   @ValidateEmail()
 *   email: string;
 * }
 *
 * @example
 * // Custom message
 * export class CreateUserDto {
 *   @ValidateEmail({ message: 'Email must be valid' })
 *   email: string;
 * }
 */
export function ValidateEmail(
  options: {
    message?: string;
    required?: boolean;
  } = {},
) {
  const { message = 'Invalid email address', required = true } = options;

  const decorators = [
    IsEmail({}, { message }),
    Transform(({ value }) => value?.toLowerCase().trim()),
  ];

  if (required) {
    decorators.push(IsNotEmpty({ message: 'Email is required' }));
  }

  return applyDecorators(...decorators);
}
