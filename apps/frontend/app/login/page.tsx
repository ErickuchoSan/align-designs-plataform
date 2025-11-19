'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Modal from '@/app/components/Modal';
import { ButtonLoader } from '@/app/components/Loader';
import EmailInput from '@/app/components/EmailInput';
import PasswordInput from '@/app/components/PasswordInput';
import PasswordRequirements from '@/app/components/PasswordRequirements';
import api from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { isValidEmail, validatePassword, PASSWORD_REQUIREMENTS } from '@/lib/utils/validation.utils';
import { OTP } from '@/lib/constants/ui.constants';

type LoginStep = 'email' | 'password' | 'otp' | 'set-password';

export default function LoginPage() {
  const router = useRouter();
  const { login, verifyOTP } = useAuth();
  const [step, setStep] = useState<LoginStep>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // User data
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userRole, setUserRole] = useState<string | null>(null);
  const [requiresPasswordSetup, setRequiresPasswordSetup] = useState(false);

  // OTP
  const [otpToken, setOtpToken] = useState('');

  // Set Password
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Forgot Password Modal
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState<'email' | 'otp' | 'password'>('email');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotError, setForgotError] = useState('');

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate email format before submitting
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    try {
      const response = await api.post('/auth/check-email', { email });
      const data = response.data;

      setUserRole(data.role);

      if (data.hasPassword) {
        // User has password, show password input
        setStep('password');
      } else {
        // User has no password, send OTP automatically
        setRequiresPasswordSetup(true);
        await api.post('/auth/otp/request', { email });
        setStep('otp');
      }
    } catch (error) {
      setError(getErrorMessage(error, 'User not found'));
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setLoading(true);
    setError('');

    try {
      await login({ email, password });
      router.push('/dashboard');
    } catch (error) {
      setError(getErrorMessage(error, 'Invalid credentials'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await verifyOTP({ email, token: otpToken });

      if (requiresPasswordSetup) {
        // Redirect to set password
        setStep('set-password');
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      setError(getErrorMessage(error, 'Invalid OTP code'));
    } finally {
      setLoading(false);
    }
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Use unified password validation
    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
      setError(validation.error || 'Invalid password');
      setLoading(false);
      return;
    }

    try {
      await api.post('/auth/set-password', {
        password: newPassword,
        confirmPassword: confirmPassword,
      });

      // Show success message and redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      setError(getErrorMessage(error, 'Error setting password'));
    } finally {
      setLoading(false);
    }
  };

  // Paso 1: Enviar OTP al email
  const handleForgotPasswordEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotError('');

    // Validate email format before submitting
    if (!isValidEmail(forgotEmail)) {
      setForgotError('Please enter a valid email address');
      setForgotLoading(false);
      return;
    }

    try {
      await api.post('/auth/forgot-password', { email: forgotEmail });
      setForgotStep('otp');
    } catch (error) {
      setForgotError(getErrorMessage(error, 'Error sending code'));
    } finally {
      setForgotLoading(false);
    }
  };

  // Step 2: Advance to new password step (UI validation only)
  const handleForgotPasswordOtp = (e: React.FormEvent) => {
    e.preventDefault();

    if (forgotOtp.length !== OTP.DISPLAY_LENGTH) {
      setForgotError(`Code must have ${OTP.DISPLAY_LENGTH} digits`);
      return;
    }

    setForgotError('');
    setForgotStep('password');
  };

  // Step 3: Reset password with OTP
  const handleForgotPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotError('');

    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError('Passwords do not match');
      setForgotLoading(false);
      return;
    }

    // Use unified password validation
    const validation = validatePassword(forgotNewPassword);
    if (!validation.isValid) {
      setForgotError(validation.error || 'Invalid password');
      setForgotLoading(false);
      return;
    }

    try {
      await api.post('/auth/reset-password', {
        email: forgotEmail,
        otp: forgotOtp,
        newPassword: forgotNewPassword,
        confirmPassword: forgotConfirmPassword,
      });
      setForgotSuccess(true);
    } catch (error) {
      setForgotError(getErrorMessage(error, 'Error resetting password'));
    } finally {
      setForgotLoading(false);
    }
  };

  const closeForgotPasswordModal = () => {
    setShowForgotPassword(false);
    setForgotStep('email');
    setForgotEmail('');
    setForgotOtp('');
    setForgotNewPassword('');
    setForgotConfirmPassword('');
    setForgotSuccess(false);
    setForgotError('');
  };

  const resetToEmail = () => {
    setStep('email');
    setEmail('');
    setPassword('');
    setOtpToken('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setUserRole(null);
    setRequiresPasswordSetup(false);
  };

  return (
    <>
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-stone-100 to-navy-100 px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-2xl shadow-2xl border border-stone-200 animate-slideUp">
          <div>
            <h2 className="mt-2 text-center text-4xl font-bold tracking-tight text-navy-900">
              Align Designs
            </h2>
            <p className="mt-3 text-center text-sm text-stone-700">
Project management system
            </p>
          </div>

          <div className="mt-8 space-y-6">
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-4 animate-slideDown">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Paso 1: Email */}
            {step === 'email' && (
              <form onSubmit={handleEmailSubmit} className="space-y-4">
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
            )}

            {/* Step 2: Password (if the user already has a password) */}
            {step === 'password' && (
              <form onSubmit={handlePasswordLogin} className="space-y-4">
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
                    onClick={() => {
                      setForgotEmail(email);
                      setShowForgotPassword(true);
                    }}
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
                  onClick={resetToEmail}
                  className="w-full text-sm text-navy-700 hover:text-navy-900 hover:underline"
                >
                  Change email
                </button>
              </form>
            )}

            {/* Step 3: OTP Verification */}
            {step === 'otp' && (
              <form onSubmit={handleVerifyOTP} className="space-y-4">
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
                  onClick={resetToEmail}
                  className="w-full text-sm text-navy-700 hover:text-navy-900 hover:underline"
                >
                  Change email
                </button>
              </form>
            )}

            {/* Step 4: Set Password (for new users) */}
            {step === 'set-password' && (
              <form onSubmit={handleSetPassword} className="space-y-4">
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
            )}
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <Modal
        isOpen={showForgotPassword}
        onClose={closeForgotPasswordModal}
        title="Recover Password"
        size="sm"
      >
        {!forgotSuccess ? (
          <>
            {forgotError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
                {forgotError}
              </div>
            )}

            {/* Step 1: Enter Email */}
            {forgotStep === 'email' && (
              <form onSubmit={handleForgotPasswordEmail} className="space-y-4">
                <p className="text-sm text-stone-700">
Enter your email and we will send you an 8-digit code to reset your password.
                </p>

                <div>
                  <label htmlFor="forgot-email" className="block text-sm font-medium text-navy-900 mb-2">
                    Email
                  </label>
                  <EmailInput
                    value={forgotEmail}
                    onChange={setForgotEmail}
                    placeholder="your-email@example.com"
                    required
                  />
                </div>

                <div className="flex gap-3 justify-end pt-4">
                  <button
                    type="button"
                    onClick={closeForgotPasswordModal}
                    disabled={forgotLoading}
                    className="px-5 py-2.5 text-sm font-medium text-stone-800 bg-stone-200 rounded-lg hover:bg-stone-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="px-5 py-2.5 text-sm font-medium text-white bg-navy-800 rounded-lg hover:bg-navy-700 transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none min-w-[120px] flex items-center justify-center"
                  >
                    {forgotLoading ? <ButtonLoader /> : 'Send code'}
                  </button>
                </div>
              </form>
            )}

            {/* Step 2: Enter OTP */}
            {forgotStep === 'otp' && (
              <form onSubmit={handleForgotPasswordOtp} className="space-y-4">
                <div className="text-sm text-navy-700 bg-gold-50 p-4 rounded-lg border border-gold-200">
                  An 8-digit code has been sent to <strong>{forgotEmail}</strong>
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
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-4 py-4 text-center text-3xl font-mono tracking-widest border border-stone-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 transition-all"
                    placeholder="00000000"
                    autoFocus
                  />
                </div>

                <div className="flex gap-3 justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => setForgotStep('email')}
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
            {forgotStep === 'password' && (
              <form onSubmit={handleForgotPasswordReset} className="space-y-4">
                <p className="text-sm text-forest-800 bg-forest-50 p-4 rounded-lg border border-forest-200">
                  Code verified. Now set your new password.
                </p>

                <div>
                  <label htmlFor="forgot-new-password" className="block text-sm font-medium text-navy-900 mb-2">
                    New Password
                  </label>
                  <PasswordInput
                    value={forgotNewPassword}
                    onChange={setForgotNewPassword}
                    placeholder="New password"
                    required
                    showStrengthIndicator={true}
                  />
                </div>

                <div>
                  <label htmlFor="forgot-confirm-password" className="block text-sm font-medium text-navy-900 mb-2">
                    Confirm Password
                  </label>
                  <PasswordInput
                    value={forgotConfirmPassword}
                    onChange={setForgotConfirmPassword}
                    placeholder="Confirm new password"
                    required
                    showStrengthIndicator={false}
                  />
                </div>

                <div className="flex gap-3 justify-end pt-4">
                  <button
                    type="button"
                    onClick={closeForgotPasswordModal}
                    disabled={forgotLoading}
                    className="px-5 py-2.5 text-sm font-medium text-stone-800 bg-stone-200 rounded-lg hover:bg-stone-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="px-5 py-2.5 text-sm font-medium text-white bg-navy-800 rounded-lg hover:bg-navy-700 transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none min-w-[140px] flex items-center justify-center"
                  >
                    {forgotLoading ? <ButtonLoader /> : 'Change password'}
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
              onClick={closeForgotPasswordModal}
              className="px-6 py-2.5 text-sm font-medium text-white bg-navy-800 rounded-lg hover:bg-navy-700 transition-all transform hover:scale-105"
            >
Got it
            </button>
          </div>
        )}
      </Modal>
    </>
  );
}
