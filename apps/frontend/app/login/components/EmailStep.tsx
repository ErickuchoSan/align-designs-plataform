'use client';

import { FormEvent } from 'react';
import { ButtonLoader } from '@/app/components/Loader';

interface EmailStepProps {
  email: string;
  setEmail: (email: string) => void;
  onSubmit: (e: FormEvent) => Promise<void>;
  loading: boolean;
  error: string;
}

export default function EmailStep({ email, setEmail, onSubmit, loading, error }: EmailStepProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-navy-900 mb-2">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="block w-full rounded-lg border border-stone-300 px-4 py-3 shadow-sm focus:border-gold-500 focus:ring-2 focus:ring-gold-500 transition-all"
          placeholder="your-email@example.com"
          autoFocus
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-navy-800 px-4 py-3 text-white font-medium hover:bg-navy-700 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-all transform hover:scale-105 disabled:transform-none flex items-center justify-center"
      >
        {loading ? <ButtonLoader /> : 'Continue'}
      </button>
    </form>
  );
}
