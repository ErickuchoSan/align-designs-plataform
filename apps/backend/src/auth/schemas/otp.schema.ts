import { z } from 'zod';
import { emailSchema, otpSchema } from '../../common/schemas';

/**
 * Request OTP schema (forgot password, etc.)
 */
export const RequestOtpSchema = z.object({
  email: emailSchema,
});

export type RequestOtpDto = z.infer<typeof RequestOtpSchema>;

/**
 * Check email schema (same as request OTP)
 */
export const CheckEmailSchema = RequestOtpSchema;
export type CheckEmailDto = z.infer<typeof CheckEmailSchema>;

/**
 * Forgot password schema (same as request OTP)
 */
export const ForgotPasswordSchema = RequestOtpSchema;
export type ForgotPasswordDto = z.infer<typeof ForgotPasswordSchema>;

/**
 * Verify OTP schema
 */
export const VerifyOtpSchema = z.object({
  email: emailSchema,
  token: otpSchema,
});

export type VerifyOtpDto = z.infer<typeof VerifyOtpSchema>;
