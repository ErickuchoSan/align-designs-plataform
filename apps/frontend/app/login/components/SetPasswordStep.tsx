'use client';

import { FormEvent } from 'react';
import { ButtonLoader } from '@/app/components/Loader';
import PasswordInput from '@/app/components/PasswordInput';
import PasswordRequirements from '@/app/components/PasswordRequirements';

interface SetPasswordStepProps {
  newPassword: string;
  setNewPassword: (password: string) => void;
  confirmPassword: string;
  setConfirmPassword: (password: string) => void;
  onSubmit: (e: FormEvent) => Promise<void>;
  loading: boolean;
  error: string;
}

export default function SetPasswordStep({
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  onSubmit,
  loading,
  error
}: SetPasswordStepProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="text-sm text-forest-800 bg-forest-50 p-4 rounded-lg border border-forest-200">
        <p className="font-medium text-forest-900 mb-1">Code verified!</p>
        <p>Please set a password to activate your account.</p>
      </div>
      <div>
        <label htmlFor="new-password" className="block text-sm font-medium text-navy-900 mb-2">
          New Password
        </label>
        <PasswordInput
          value={newPassword}
          onChange={(value) => setNewPassword(value)}
          placeholder="Minimum 12 characters"
          required
          showStrengthIndicator={true}
        />
      </div>
      <div>
        <label htmlFor="confirm-password" className="block text-sm font-medium text-navy-900 mb-2">
          Confirm Password
        </label>
        <PasswordInput
          value={confirmPassword}
          onChange={(value) => setConfirmPassword(value)}
          placeholder="Repeat your password"
          required
          showStrengthIndicator={false}
        />
      </div>

      {/* Password Requirements Checklist */}
      {newPassword && (
        <PasswordRequirements
          password={newPassword}
          className="bg-forest-50 border border-forest-200 rounded-lg p-4"
        />
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-navy-800 px-4 py-3 text-white font-medium hover:bg-navy-700 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-all transform hover:scale-105 disabled:transform-none flex items-center justify-center"
      >
        {loading ? <ButtonLoader /> : 'Set password'}
      </button>
    </form>
  );
}
