'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AuthService } from '@/services/auth.service';
import Loader, { ButtonLoader } from '@/components/ui/Loader';
import PasswordInput from '@/components/ui/inputs/PasswordInput';
import PasswordRequirements from '@/components/ui/inputs/PasswordRequirements';
import { handleApiError } from '@/lib/errors';
import { toast } from 'react-hot-toast';
import { logger } from '@/lib/logger';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      toast.error('Invalid or missing token');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setIsLoading(true);

    try {
      await AuthService.resetPassword({
        token,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
      });
      toast.success('Password reset successfully! Redirecting to login...');
      setIsSuccess(true);
      setTimeout(() => router.push('/login'), 2000);
    } catch (err) {
      logger.error('Failed to reset password', err, { hasToken: !!token });
      toast.error(handleApiError(err));
    } finally {
      setIsLoading(false);
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

  if (isSuccess) {
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy-50 to-stone-100 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full animate-slideUp">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Reset Password</h1>
          <p className="text-gray-600">Enter your new password</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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

            {/* Password Requirements Checklist - shown only for new password */}
            {formData.newPassword && (
              <div className="mt-3">
                <PasswordRequirements
                  password={formData.newPassword}
                  className="bg-navy-50 border border-navy-200 rounded-lg p-4"
                />
              </div>
            )}
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
            {/* Show match indicator when user starts typing confirmation */}
            {formData.confirmPassword && (
              <p className={`mt-2 text-sm flex items-center gap-1 ${formData.newPassword === formData.confirmPassword
                ? 'text-green-600'
                : 'text-red-600'
                }`}>
                {formData.newPassword === formData.confirmPassword ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Passwords match
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Passwords do not match
                  </>
                )}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-navy-600 text-white py-3 rounded-lg hover:bg-navy-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none font-medium shadow-lg flex items-center justify-center"
          >
            {isLoading ? <ButtonLoader /> : 'Reset Password'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => router.push('/login')}
            className="text-sm text-navy-600 hover:text-navy-700 hover:underline"
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
