import { z } from 'zod';
import { PASSWORD_CONSTRAINTS } from '../constants/validation.constants';

/**
 * Strong password schema with all requirements
 */
export const passwordSchema = z
  .string()
  .min(
    PASSWORD_CONSTRAINTS.MIN_LENGTH,
    `Password must be at least ${PASSWORD_CONSTRAINTS.MIN_LENGTH} characters`,
  )
  .max(
    PASSWORD_CONSTRAINTS.MAX_LENGTH,
    `Password must be at most ${PASSWORD_CONSTRAINTS.MAX_LENGTH} characters`,
  )
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/\d/, 'Password must contain at least one number')
  .regex(
    /[^A-Za-z0-9]/,
    'Password must contain at least one special character',
  );

/**
 * Simple password schema (for login, just non-empty)
 */
export const loginPasswordSchema = z
  .string()
  .min(1, 'Password is required');

/**
 * Current password schema (for change password)
 */
export const currentPasswordSchema = z
  .string()
  .min(1, 'Current password is required');

/**
 * Password with confirmation schema
 */
export const passwordWithConfirmationSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

/**
 * New password with confirmation schema (for reset/change)
 */
export const newPasswordWithConfirmationSchema = z
  .object({
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });
