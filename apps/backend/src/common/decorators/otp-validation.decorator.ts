import { applyDecorators } from '@nestjs/common';
import { IsString, Length, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * Composite decorator for OTP validation
 * Validates that OTP is exactly 8 digits
 *
 * Combines:
 * - IsString validation
 * - Length validation (8 characters)
 * - Pattern validation (only digits)
 * - Trim transformation
 *
 * @example
 * export class VerifyOtpDto {
 *   @ValidateOtp()
 *   token: string;
 * }
 */
export function ValidateOtp(options: { fieldName?: string } = {}) {
  const { fieldName = 'OTP code' } = options;

  return applyDecorators(
    IsString(),
    Length(8, 8, { message: `${fieldName} must have 8 digits` }),
    Matches(/^\d{8}$/, { message: `${fieldName} must contain only digits` }),
    Transform(({ value }) => value?.trim()),
  );
}
