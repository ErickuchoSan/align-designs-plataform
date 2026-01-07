'use client';

import { useState, FormEvent } from 'react';
import Modal from '@/app/components/Modal';
import { ButtonLoader } from '@/app/components/Loader';
import EmailInput from '@/app/components/EmailInput';
import PasswordInput from '@/app/components/PasswordInput';
import PasswordRequirements from '@/app/components/PasswordRequirements';
import { api } from '@/lib/api';
import { handleApiError } from '@/lib/errors';
import { isValidEmail, validatePassword } from '@/lib/utils/validation.utils';
import { OTP } from '@/lib/constants/ui.constants';
import { toast } from 'react-hot-toast';
import { logger } from '@/lib/logger';

interface ForgotPasswordModalProps {
  show: boolean;
  onClose: () => void;
  initialEmail?: string;
}

type ForgotPasswordStep = 'email' | 'otp' | 'password';

export default function ForgotPasswordModal({ show, onClose, initialEmail = '' }: ForgotPasswordModalProps) {
  const [step, setStep] = useState<ForgotPasswordStep>('email');
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleClose = () => {
    setStep('email');
    setEmail('');
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setIsSuccess(false);
    onClose();
  };

  // Update email when initialEmail changes
  if (initialEmail && email !== initialEmail && !show) {
    setEmail(initialEmail);
  }

  const handleEmailSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!isValidEmail(email)) {
      toast.error('Please enter a valid email address');
      setIsLoading(false);
      return;
    }

    try {
      await api.post('/auth/forgot-password', { email });
      toast.success('Verification code sent to your email');
      setStep('otp');
    } catch (error) {
      logger.error('Failed to send forgot password code', error, { email });
      toast.error(handleApiError(error, 'Error sending code'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (otp.length !== OTP.DISPLAY_LENGTH) {
      toast.error(`Code must have ${OTP.DISPLAY_LENGTH} digits`);
      return;
    }

    setStep('password');
  };

  const handlePasswordReset = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      setIsLoading(false);
      return;
    }

    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
      toast.error(validation.error || 'Invalid password');
      setIsLoading(false);
      return;
    }

    try {
      await api.post('/auth/reset-password', {
        email,
        otp,
        newPassword,
        confirmPassword,
      });
      toast.success('Password updated successfully!');
      setIsSuccess(true);
    } catch (error) {
      logger.error('Failed to reset password via forgot password', error, { email, hasOtp: !!otp });
      toast.error(handleApiError(error, 'Error resetting password'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={show}
      onClose={handleClose}
      title="Recover Password"
      size="sm"
    >
      {!isSuccess ? (
        <>
          {/* Step 1: Enter Email */}
          {step === 'email' && (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <p className="text-sm text-stone-700">
                Enter your email and we will send you an 8-digit code to reset your password.
              </p>

              <div>
                <label htmlFor="forgot-email" className="block text-sm font-medium text-navy-900 mb-2">
                  Email
                </label>
                <EmailInput
                  value={email}
                  onChange={setEmail}
                  placeholder="your-email@example.com"
                  required
                />
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isLoading}
                  className="px-5 py-2.5 text-sm font-medium text-stone-800 bg-stone-200 rounded-lg hover:bg-stone-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-navy-800 rounded-lg hover:bg-navy-700 transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none min-w-[120px] flex items-center justify-center"
                >
                  {isLoading ? <ButtonLoader /> : 'Send code'}
                </button>
              </div>
            </form>
          )}

          {/* Step 2: Enter OTP */}
          {step === 'otp' && (
            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <div className="text-sm text-navy-700 bg-gold-50 p-4 rounded-lg border border-gold-200">
                An 8-digit code has been sent to <strong>{email}</strong>
              </div>

              <div>
                <label htmlFor="forgot-otp" className="block text-sm font-medium text-navy-900 mb-2">
                  OTP Code
                </label>
                <input
                  id="forgot-otp"
                  type="text"
                  required
                  maxLength={8}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-4 text-center text-3xl font-mono tracking-widest border border-stone-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 transition-all"
                  placeholder="00000000"
                  autoFocus
                />
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setStep('email')}
                  className="px-5 py-2.5 text-sm font-medium text-stone-800 bg-stone-200 rounded-lg hover:bg-stone-300 transition-colors"
                >
                  Change email
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-sm font-medium text-white bg-navy-800 rounded-lg hover:bg-navy-700 transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500"
                >
                  Continue
                </button>
              </div>
            </form>
          )}

          {/* Step 3: New Password */}
          {step === 'password' && (
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <p className="text-sm text-forest-800 bg-forest-50 p-4 rounded-lg border border-forest-200">
                Code verified. Now set your new password.
              </p>

              <div>
                <label htmlFor="forgot-new-password" className="block text-sm font-medium text-navy-900 mb-2">
                  New Password
                </label>
                <PasswordInput
                  value={newPassword}
                  onChange={setNewPassword}
                  placeholder="New password"
                  required
                  showStrengthIndicator={true}
                />

                {/* Password Requirements Checklist - shown only for new password */}
                {newPassword && (
                  <div className="mt-3">
                    <PasswordRequirements
                      password={newPassword}
                      className="bg-forest-50 border border-forest-200 rounded-lg p-4"
                    />
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="forgot-confirm-password" className="block text-sm font-medium text-navy-900 mb-2">
                  Confirm Password
                </label>
                <PasswordInput
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  placeholder="Confirm new password"
                  required
                  showStrengthIndicator={false}
                />
                {/* Show match indicator when user starts typing confirmation */}
                {confirmPassword && (
                  <p className={`mt-2 text-sm flex items-center gap-1 ${newPassword === confirmPassword
                    ? 'text-green-600'
                    : 'text-red-600'
                    }`}>
                    {newPassword === confirmPassword ? (
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

              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isLoading}
                  className="px-5 py-2.5 text-sm font-medium text-stone-800 bg-stone-200 rounded-lg hover:bg-stone-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-navy-800 rounded-lg hover:bg-navy-700 transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none min-w-[140px] flex items-center justify-center"
                >
                  {isLoading ? <ButtonLoader /> : 'Change password'}
                </button>
              </div>
            </form>
          )}
        </>
      ) : (
        <div className="text-center py-4">
          <div className="mx-auto w-16 h-16 bg-forest-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-forest-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-navy-900 mb-2">Password updated!</h3>
          <p className="text-sm text-stone-700 mb-6">
            Your password has been reset successfully. You can now log in with your new password.
          </p>
          <button
            onClick={handleClose}
            className="px-6 py-2.5 text-sm font-medium text-white bg-navy-800 rounded-lg hover:bg-navy-700 transition-all transform hover:scale-105"
          >
            Got it
          </button>
        </div>
      )}
    </Modal>
  );
}
