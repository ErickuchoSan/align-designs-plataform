'use client';

import { FormEvent } from 'react';
import { ButtonLoader } from '@/app/components/Loader';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';

interface OTPStepProps {
  email: string;
  otpToken: string;
  setOtpToken: (token: string) => void;
  onSubmit: (e: FormEvent) => Promise<void>;
  onResend: () => Promise<void>;
  loading: boolean;
  error: string;
  onBack: () => void;
  requiresPasswordSetup?: boolean;
}

export default function OTPStep({
  email,
  otpToken,
  setOtpToken,
  onSubmit,
  onResend,
  loading,
  error,
  onBack,
  requiresPasswordSetup = false
}: OTPStepProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
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
          required
          maxLength={8}
          value={otpToken}
          onChange={(e) => setOtpToken(e.target.value)}
          className="block w-full rounded-lg border border-stone-300 px-4 py-4 text-center text-3xl font-mono tracking-widest shadow-sm focus:border-gold-500 focus:ring-2 focus:ring-gold-500 transition-all"
          placeholder="00000000"
          autoFocus
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-navy-800 px-4 py-3 text-white font-medium hover:bg-navy-700 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-all transform hover:scale-105 disabled:transform-none flex items-center justify-center"
      >
        {loading ? <ButtonLoader /> : 'Verify code'}
      </button>
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
