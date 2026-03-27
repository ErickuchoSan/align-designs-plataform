'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { passwordSchema, PasswordFormData } from '@/lib/schemas/auth.schema';
import LoadingButton from '@/components/ui/LoadingButton';
import { cn, INPUT_BASE, INPUT_VARIANTS, FORM_LABEL, BUTTON_BASE, BUTTON_VARIANTS, BUTTON_SIZES } from '@/lib/styles';

interface PasswordStepProps {
  email: string;
  onSubmit: (data: PasswordFormData) => Promise<void>;
  onForgotPassword: () => void;
  onLoginWithOTP: () => void;
  loading: boolean;
  onBack: () => void;
}

export default function PasswordStep({
  email: _email,
  onSubmit,
  onForgotPassword,
  onLoginWithOTP,
  loading,
  onBack
}: Readonly<PasswordStepProps>) {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema)
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label htmlFor="password" className={FORM_LABEL}>
          Password
        </label>
        <input
          id="password"
          type="password"
          {...register('password')}
          className={cn(
            INPUT_BASE,
            errors.password ? INPUT_VARIANTS.error : INPUT_VARIANTS.default
          )}
          placeholder="••••••••"
          autoFocus
        />
        {errors.password && (
          <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
        )}
      </div>
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={onForgotPassword}
          className="text-xs font-medium text-[#6B6A65] hover:text-[#1B1C1A] uppercase tracking-widest"
        >
          Forgot password?
        </button>
      </div>
      <LoadingButton type="submit" isLoading={loading} variant="primary" size="lg" fullWidth className="uppercase tracking-widest text-sm">
        Sign In
      </LoadingButton>
      <button
        type="button"
        onClick={onLoginWithOTP}
        disabled={loading}
        className={cn(BUTTON_BASE, BUTTON_VARIANTS.secondary, BUTTON_SIZES.lg, 'w-full uppercase tracking-widest text-sm')}
      >
        Login with OTP
      </button>
      <button
        type="button"
        onClick={onBack}
        className="w-full text-xs text-[#6B6A65] hover:text-[#1B1C1A] hover:underline uppercase tracking-widest"
      >
        Change email
      </button>
    </form>
  );
}
