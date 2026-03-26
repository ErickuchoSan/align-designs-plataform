'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { otpSchema, OtpFormData } from '@/lib/schemas/auth.schema';
import LoadingButton from '@/components/ui/LoadingButton';
import { cn, INPUT_BASE, INPUT_VARIANTS } from '@/lib/styles';

interface OTPStepProps {
  email: string;
  onSubmit: (data: OtpFormData) => Promise<void>;
  onResend: () => Promise<void>;
  loading: boolean;
  onBack: () => void;
  requiresPasswordSetup?: boolean;
}

export default function OTPStep({
  email,
  onSubmit,
  onResend: _onResend,
  loading,
  onBack,
  requiresPasswordSetup = false
}: Readonly<OTPStepProps>) {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema)
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="text-sm text-navy-700 bg-gold-50 p-4 rounded-lg border border-gold-200">
        An 8-digit code has been sent to <strong>{email}</strong>
        {requiresPasswordSetup && (
          <p className="mt-2 text-xs text-stone-700">
            After verifying the code, you will need to set a password for your account.
          </p>
        )}
      </div>
      <div>
        <label htmlFor="otp-token" className="block text-sm font-medium text-navy-900 mb-2">
          OTP Code
        </label>
        <input
          id="otp-token"
          type="text"
          maxLength={8}
          {...register('otpToken')}
          className={cn(
            INPUT_BASE,
            'py-4 text-center text-3xl font-mono tracking-widest shadow-sm',
            errors.otpToken ? INPUT_VARIANTS.error : INPUT_VARIANTS.default
          )}
          placeholder="00000000"
          autoFocus
        />
        {errors.otpToken && (
          <p className="mt-1 text-sm text-red-600">{errors.otpToken.message}</p>
        )}
      </div>
      <LoadingButton type="submit" isLoading={loading} variant="primary" size="lg" fullWidth>
        Verify code
      </LoadingButton>
      <button
        type="button"
        onClick={onBack}
        className="w-full text-sm text-navy-700 hover:text-navy-900 hover:underline"
      >
        Change email
      </button>
    </form>
  );
}
