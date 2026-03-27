'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { otpSchema, OtpFormData } from '@/lib/schemas/auth.schema';
import LoadingButton from '@/components/ui/LoadingButton';
import { cn, INPUT_BASE, INPUT_VARIANTS, FORM_LABEL } from '@/lib/styles';

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
  onResend,
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <p className="text-xs text-[#6B6A65] leading-relaxed">
        An 8-digit code was sent to <span className="font-semibold text-[#1B1C1A]">{email}</span>.
        {requiresPasswordSetup && (
          <> After verifying, you&apos;ll set a password for your account.</>
        )}
      </p>
      <div>
        <label htmlFor="otp-token" className={FORM_LABEL}>
          Verification code
        </label>
        <input
          id="otp-token"
          type="text"
          inputMode="numeric"
          maxLength={8}
          {...register('otpToken')}
          className={cn(
            INPUT_BASE,
            'py-4 text-center text-3xl font-mono tracking-[0.5em]',
            errors.otpToken ? INPUT_VARIANTS.error : INPUT_VARIANTS.default
          )}
          placeholder="00000000"
          autoFocus
        />
        {errors.otpToken && (
          <p className="mt-1 text-xs text-red-600">{errors.otpToken.message}</p>
        )}
      </div>
      <LoadingButton type="submit" isLoading={loading} variant="primary" size="lg" fullWidth className="uppercase tracking-widest text-sm">
        Verify Identity
      </LoadingButton>
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="text-xs text-[#6B6A65] hover:text-[#1B1C1A] uppercase tracking-widest"
        >
          Change email
        </button>
        <button
          type="button"
          onClick={onResend}
          disabled={loading}
          className="text-xs text-[#C9A84C] hover:text-[#755B00] uppercase tracking-widest font-semibold disabled:opacity-50"
        >
          Resend code
        </button>
      </div>
    </form>
  );
}
