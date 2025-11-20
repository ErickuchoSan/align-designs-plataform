'use client';
import { MESSAGE_DURATION } from '@/lib/constants/ui.constants';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import Loader, { ButtonLoader } from '@/app/components/Loader';
import PasswordInput from '@/app/components/PasswordInput';
import PasswordRequirements from '@/app/components/PasswordRequirements';
import { getErrorMessage } from '@/lib/errors';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing token');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setLoading(true);
    setError('');

    try {
      await api.post('/auth/reset-password', {
        token,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
      });
      setSuccess(true);
      setTimeout(() => router.push('/login'), MESSAGE_DURATION.SUCCESS);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center">
          <p className="text-red-600">Invalid or missing token</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full animate-scaleIn">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Password updated!</h2>
          <p className="text-gray-600 mb-4">Your password has been reset successfully.</p>
          <p className="text-sm text-gray-500">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full animate-slideUp">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Reset Password</h1>
          <p className="text-gray-600">Enter your new password</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
              New Password
            </label>
            <PasswordInput
              value={formData.newPassword}
              onChange={(newPassword) => setFormData({ ...formData, newPassword })}
              placeholder="Minimum 12 characters"
              required
              showStrengthIndicator={true}
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password
            </label>
            <PasswordInput
              value={formData.confirmPassword}
              onChange={(confirmPassword) => setFormData({ ...formData, confirmPassword })}
              placeholder="Confirm your password"
              required
              showStrengthIndicator={false}
            />
          </div>

          {/* Password Requirements Checklist */}
          {formData.newPassword && (
            <PasswordRequirements
              password={formData.newPassword}
              className="bg-blue-50 border border-blue-200 rounded-lg p-4"
            />
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none font-medium shadow-lg flex items-center justify-center"
          >
            {loading ? <ButtonLoader /> : 'Reset Password'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => router.push('/login')}
            className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
          >
            Back to login
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<Loader size="lg" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
