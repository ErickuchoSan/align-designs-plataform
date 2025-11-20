'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { isValidEmail, validatePassword } from '@/lib/utils/validation.utils';
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

      // Role is no longer returned here to prevent user enumeration
      // It will be provided after successful authentication

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

  const handleResendOTP = async () => {
    setLoading(true);
    setError('');

    try {
      await api.post('/auth/otp/request', { email });
    } catch (error) {
      setError(getErrorMessage(error, 'Error resending code'));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    setShowForgotPassword(true);
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

            {step === 'email' && (
              <EmailStep
                email={email}
                setEmail={setEmail}
                onSubmit={handleEmailSubmit}
                loading={loading}
                error={error}
              />
            )}

            {step === 'password' && (
              <PasswordStep
                email={email}
                password={password}
                setPassword={setPassword}
                onSubmit={handlePasswordLogin}
                onForgotPassword={handleForgotPassword}
                loading={loading}
                error={error}
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
                loading={loading}
                error={error}
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
                loading={loading}
                error={error}
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
