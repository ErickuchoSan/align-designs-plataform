'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { passwordSchema, PasswordFormData } from '@/lib/schemas/auth.schema';
import LoadingButton from '@/components/ui/LoadingButton';
import { cn, INPUT_BASE, INPUT_VARIANTS, BUTTON_BASE, BUTTON_VARIANTS, BUTTON_SIZES } from '@/lib/styles';

interface PasswordStepProps {
  email: string;
  onSubmit: (data: PasswordFormData) => Promise<void>;
  onForgotPassword: () => void;
  onLoginWithOTP: () => void;
  loading: boolean;
  onBack: () => void;
}

export default function PasswordStep({
  email,
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="text-sm text-[#6B6A65] bg-[#C9A84C]/20 p-4 rounded-lg animate-slideDown">
        Logging in as: <strong>{email}</strong>
      </div>
      <div className="animate-slideDown">
        <label htmlFor="password" className="block text-sm font-medium text-[#1B1C1A] mb-2">
          Password
        </label>
        <input
          id="password"
          type="password"
          {...register('password')}
          className={cn(
            INPUT_BASE,
            'shadow-sm',
            errors.password ? INPUT_VARIANTS.error : INPUT_VARIANTS.default
          )}
          placeholder="••••••••"
          autoFocus
        />
        {errors.password && (
          <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
        )}
      </div>
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={onForgotPassword}
          className="text-sm text-[#6B6A65] hover:text-[#1B1C1A] hover:underline"
        >
          Forgot your password?
        </button>
      </div>
      <LoadingButton type="submit" isLoading={loading} variant="primary" size="lg" fullWidth>
        Sign In
      </LoadingButton>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#D0C5B2]/20"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-[#6B6A65]">Or</span>
        </div>
      </div>
      <button
        type="button"
        onClick={onLoginWithOTP}
        disabled={loading}
        className={cn(BUTTON_BASE, BUTTON_VARIANTS.outline, BUTTON_SIZES.lg, 'w-full')}
      >
        Login with OTP
      </button>
      <button
        type="button"
        onClick={onBack}
        className="w-full text-sm text-[#6B6A65] hover:text-[#1B1C1A] hover:underline"
      >
        Change email
      </button>
    </form>
  );
}
