import { z } from 'zod';

export const emailSchema = z.object({
    email: z
        .string()
        .min(1, 'Email is required')
        .email('Please enter a valid email address'),
});

export const passwordSchema = z.object({
    password: z
        .string()
        .min(1, 'Password is required'),
});

export const otpSchema = z.object({
    otpToken: z
        .string()
        .length(8, 'OTP must be exactly 8 digits')
        .regex(/^\d+$/, 'OTP must contain only numbers'),
});

export const setPasswordSchema = z.object({
    newPassword: z
        .string()
        .min(12, 'Password must be at least 12 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/\d/, 'Password must contain at least one number')
        .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data: { newPassword: string; confirmPassword: string }) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

export type EmailFormData = z.infer<typeof emailSchema>;
export type PasswordFormData = z.infer<typeof passwordSchema>;
export type OtpFormData = z.infer<typeof otpSchema>;
export type SetPasswordFormData = z.infer<typeof setPasswordSchema>;
