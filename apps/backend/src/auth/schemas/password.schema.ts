import { z } from 'zod';
import {
  emailSchema,
  otpSchema,
  passwordSchema,
  currentPasswordSchema,
} from '../../common/schemas';

/**
 * Set password schema (initial password setup)
 */
export const SetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Password confirmation is required'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export type SetPasswordDto = z.infer<typeof SetPasswordSchema>;

/**
 * Reset password schema (with OTP verification)
 */
export const ResetPasswordSchema = z
  .object({
    email: emailSchema,
    otp: otpSchema,
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, 'Password confirmation is required'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export type ResetPasswordDto = z.infer<typeof ResetPasswordSchema>;

/**
 * Change password schema (logged in user)
 */
export const ChangePasswordSchema = z
  .object({
    currentPassword: currentPasswordSchema,
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, 'Password confirmation is required'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export type ChangePasswordDto = z.infer<typeof ChangePasswordSchema>;
