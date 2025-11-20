'use client';

import { FormEvent } from 'react';
import { ButtonLoader } from '@/app/components/Loader';

interface PasswordStepProps {
  email: string;
  password: string;
  setPassword: (password: string) => void;
  onSubmit: (e: FormEvent) => Promise<void>;
  onForgotPassword: () => void;
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
