import { z } from 'zod';

/**
 * OTP schema (8 digit code)
 */
export const otpSchema = z
  .string()
  .length(8, 'OTP must be exactly 8 digits')
  .regex(/^\d{8}$/, 'OTP must contain only numbers');
