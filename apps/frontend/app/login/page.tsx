'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { handleApiError } from '@/lib/errors';
import { isValidEmail, validatePassword } from '@/lib/utils/validation.utils';
import { toast } from 'react-hot-toast';
import { logger } from '@/lib/logger';
import EmailStep from './components/EmailStep';
import PasswordStep from './components/PasswordStep';
import OTPStep from './components/OTPStep';
import SetPasswordStep from './components/SetPasswordStep';
import ForgotPasswordModal from './components/ForgotPasswordModal';

type LoginStep = 'email' | 'password' | 'otp' | 'set-password';

export default function LoginPage() {
  const router = useRouter();
  const { login, verifyOTP } = useAuth();
  const [step, setStep] = useState<LoginStep>('email');
  const [isLoading, setIsLoading] = useState(false);

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

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!isValidEmail(email)) {
      toast.error('Please enter a valid email address');
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.post<{ hasPassword: boolean; requiresPasswordSetup: boolean }>(
        '/auth/check-email',
        { email }
      );

      const { hasPassword, requiresPasswordSetup } = response.data;

      if (!hasPassword && !requiresPasswordSetup) {
        toast.error('Email not found. Please check your email address.');
        setIsLoading(false);
        return;
      }

      if (requiresPasswordSetup) {
        setRequiresPasswordSetup(true);
        await api.post('/auth/otp/request', { email });
        toast.success('Verification code sent to your email');
        setStep('otp');
        return;
      }

      if (hasPassword) {
        setStep('password');
        return;
      }

      setStep('password');
    } catch (error) {
      logger.error('Failed to check email', error, { email });
      toast.error(handleApiError(error, 'An error occurred. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLoading(true);

    try {
      await login({ email, password });
      router.push('/dashboard');
    } catch (error) {
      logger.error('Failed to login with password', error, { email });
      toast.error(handleApiError(error, 'Invalid credentials'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await verifyOTP({ email, token: otpToken });

      if (requiresPasswordSetup) {
        toast.success('OTP verified successfully');
        setStep('set-password');
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      logger.error('Failed to verify OTP', error, { email });
      toast.error(handleApiError(error, 'Invalid OTP code'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetPassword = async (e: React.FormEvent) => {
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
      await api.post('/auth/set-password', {
        password: newPassword,
        confirmPassword: confirmPassword,
      });

      toast.success('Password set successfully! Please log in with your email and password.');
      setStep('email');
      setEmail('');
      setPassword('');
      setOtpToken('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      logger.error('Failed to set password', error, { email });
      toast.error(handleApiError(error, 'Error setting password'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsLoading(true);

    try {
      await api.post('/auth/otp/request', { email });
      toast.success('Verification code sent to your email');
    } catch (error) {
      logger.error('Failed to resend OTP', error, { email });
      toast.error(handleApiError(error, 'Error resending code'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    setShowForgotPassword(true);
  };

  const handleLoginWithOTP = async () => {
    setIsLoading(true);

    try {
      await api.post('/auth/otp/request', { email });
      toast.success('Verification code sent to your email');
      setStep('otp');
    } catch (error) {
      logger.error('Failed to request OTP login', error, { email });
      toast.error(handleApiError(error, 'Error requesting OTP'));
    } finally {
      setIsLoading(false);
    }
  };

  const resetToEmail = () => {
    setStep('email');
    setEmail('');
    setPassword('');
    setOtpToken('');
    setNewPassword('');
    setConfirmPassword('');
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
            {step === 'email' && (
              <EmailStep
                email={email}
                setEmail={setEmail}
                onSubmit={handleEmailSubmit}
                isLoading={isLoading}
              />
            )}

            {step === 'password' && (
              <PasswordStep
                email={email}
                password={password}
                setPassword={setPassword}
                onSubmit={handlePasswordLogin}
                onForgotPassword={handleForgotPassword}
                onLoginWithOTP={handleLoginWithOTP}
                isLoading={isLoading}
                onBack={resetToEmail}
              />
            )}

            {step === 'otp' && (
              <OTPStep
                email={email}
                otpToken={otpToken}
                setOtpToken={setOtpToken}
                onSubmit={handleVerifyOTP}
                onResend={handleResendOTP}
                isLoading={isLoading}
                onBack={resetToEmail}
                requiresPasswordSetup={requiresPasswordSetup}
              />
            )}

            {step === 'set-password' && (
              <SetPasswordStep
                newPassword={newPassword}
                setNewPassword={setNewPassword}
                confirmPassword={confirmPassword}
                setConfirmPassword={setConfirmPassword}
                onSubmit={handleSetPassword}
                isLoading={isLoading}
              />
            )}
          </div>
        </div>
      </div>

      <ForgotPasswordModal
        show={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
        initialEmail={email}
      />
    </>
  );
}
