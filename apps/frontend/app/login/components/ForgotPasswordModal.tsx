'use client';

import { useState, FormEvent } from 'react';
import Modal from '@/components/ui/Modal';
import LoadingButton from '@/components/ui/LoadingButton';
import EmailInput from '@/components/ui/inputs/EmailInput';
import PasswordInput from '@/components/ui/inputs/PasswordInput';
import PasswordRequirements from '@/components/ui/inputs/PasswordRequirements';
import { AuthService } from '@/services/auth.service';
import { handleApiError } from '@/lib/errors';
import { isValidEmail, validatePassword } from '@/lib/utils/validation.utils';
import { OTP } from '@/lib/constants/ui.constants';
import { toast } from '@/lib/toast';
import { cn, INPUT_BASE, INPUT_VARIANTS, BUTTON_BASE, BUTTON_VARIANTS, BUTTON_SIZES } from '@/lib/styles';
import { CheckIcon, CloseIcon } from '@/components/ui/icons';

interface ForgotPasswordModalProps {
  show: boolean;
  onClose: () => void;
  initialEmail?: string;
}

type ForgotPasswordStep = 'email' | 'otp' | 'password';

export default function ForgotPasswordModal({ show, onClose, initialEmail = '' }: Readonly<ForgotPasswordModalProps>) {
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
      await AuthService.forgotPassword(email);
      toast.success('Verification code sent to your email');
      setStep('otp');
    } catch (error) {
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
      await AuthService.resetPassword({
        email,
        otp,
        newPassword,
        confirmPassword,
      });
      toast.success('Password updated successfully!');
      setIsSuccess(true);
    } catch (error) {
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
                  className={cn(BUTTON_BASE, BUTTON_VARIANTS.secondary, BUTTON_SIZES.md)}
                >
                  Cancel
                </button>
                <LoadingButton type="submit" isLoading={isLoading} variant="primary" size="md">
                  Send code
                </LoadingButton>
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
                  className={cn(INPUT_BASE, INPUT_VARIANTS.default, 'py-4 text-center text-3xl font-mono tracking-widest')}
                  placeholder="00000000"
                  autoFocus
                />
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setStep('email')}
                  className={cn(BUTTON_BASE, BUTTON_VARIANTS.secondary, BUTTON_SIZES.md)}
                >
                  Change email
                </button>
                <button type="submit" className={cn(BUTTON_BASE, BUTTON_VARIANTS.primary, BUTTON_SIZES.md)}>
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
                  <p
                    className={`mt-2 text-sm flex items-center gap-1 ${newPassword === confirmPassword ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {newPassword === confirmPassword ? (
                      <>
                        <CheckIcon size="md" />
                        Passwords match
                      </>
                    ) : (
                      <>
                        <CloseIcon size="md" />
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
                  className={cn(BUTTON_BASE, BUTTON_VARIANTS.secondary, BUTTON_SIZES.md)}
                >
                  Cancel
                </button>
                <LoadingButton type="submit" isLoading={isLoading} variant="primary" size="md">
                  Change password
                </LoadingButton>
              </div>
            </form>
          )}
        </>
      ) : (
        <div className="text-center py-4">
          <div className="mx-auto w-16 h-16 bg-forest-100 rounded-full flex items-center justify-center mb-4">
            <CheckIcon size="lg" className="w-8 h-8 text-forest-600" />
          </div>
          <h3 className="text-lg font-semibold text-navy-900 mb-2">Password updated!</h3>
          <p className="text-sm text-stone-700 mb-6">
            Your password has been reset successfully. You can now log in with your new password.
          </p>
          <button onClick={handleClose} className={cn(BUTTON_BASE, BUTTON_VARIANTS.primary, BUTTON_SIZES.md)}>
            Got it
          </button>
        </div>
      )}
    </Modal>
  );
}
