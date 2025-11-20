'use client';

import { FormEvent } from 'react';
import { ButtonLoader } from '@/app/components/Loader';

interface PasswordStepProps {
  email: string;
  password: string;
  setPassword: (password: string) => void;
  onSubmit: (e: FormEvent) => Promise<void>;
  onForgotPassword: () => void;
  onLoginWithOTP: () => void;
  loading: boolean;
  error: string;
  onBack: () => void;
}

export default function PasswordStep({
  email,
  password,
  setPassword,
  onSubmit,
  onForgotPassword,
  onLoginWithOTP,
  loading,
  error,
  onBack
}: PasswordStepProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="text-sm text-navy-700 bg-gold-50 p-4 rounded-lg border border-gold-200 animate-slideDown">
        Logging in as: <strong>{email}</strong>
      </div>
      <div className="animate-slideDown">
        <label htmlFor="password" className="block text-sm font-medium text-navy-900 mb-2">
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="block w-full rounded-lg border border-stone-300 px-4 py-3 shadow-sm focus:border-gold-500 focus:ring-2 focus:ring-gold-500 transition-all"
          placeholder="••••••••"
          autoFocus
        />
      </div>
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={onForgotPassword}
          className="text-sm text-navy-700 hover:text-navy-900 hover:underline"
        >
          Forgot your password?
        </button>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-navy-800 px-4 py-3 text-white font-medium hover:bg-navy-700 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-all transform hover:scale-105 disabled:transform-none flex items-center justify-center"
      >
        {loading ? <ButtonLoader /> : 'Sign In'}
      </button>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-stone-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-stone-500">Or</span>
        </div>
      </div>
      <button
        type="button"
        onClick={onLoginWithOTP}
        disabled={loading}
        className="w-full rounded-lg border-2 border-navy-800 px-4 py-3 text-navy-800 font-medium hover:bg-navy-50 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 disabled:transform-none"
      >
        Login with OTP
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
