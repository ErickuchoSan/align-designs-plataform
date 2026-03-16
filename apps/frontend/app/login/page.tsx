'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { AuthService } from '@/services/auth.service';
import { handleApiError } from '@/lib/errors';
import { toast } from '@/lib/toast';
import { EmailFormData, PasswordFormData, OtpFormData, SetPasswordFormData } from '@/lib/schemas/auth.schema';
import EmailStep from './components/EmailStep';
import PasswordStep from './components/PasswordStep';
import OTPStep from './components/OTPStep';
import SetPasswordStep from './components/SetPasswordStep';
import ForgotPasswordModal from './components/ForgotPasswordModal';

type LoginStep = 'email' | 'password' | 'otp' | 'set-password';

export default function LoginPage() {
  const router = useRouter();
  const { login, verifyOTP, requestOTP } = useAuth();
  const [step, setStep] = useState<LoginStep>('email');
  const [isLoading, setIsLoading] = useState(false);

  // User data
  const [requiresPasswordSetup, setRequiresPasswordSetup] = useState(false);

  // Forgot Password Modal
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // We still need email state for navigation between steps
  const [email, setEmail] = useState('');

  const handleEmailSubmit = async (data: EmailFormData) => {
    setIsLoading(true);
    setEmail(data.email);

    try {
      const { hasPassword, requiresPasswordSetup: reqSetup } = await AuthService.checkEmail(data.email);

      if (!hasPassword && !reqSetup) {
        toast.error('Email not found. Please check your email address.');
        setIsLoading(false);
        return;
      }

      if (reqSetup) {
        setRequiresPasswordSetup(true);
        await requestOTP({ email: data.email });
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
      toast.error(handleApiError(error, 'An error occurred. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordLogin = async (data: PasswordFormData) => {
    setIsLoading(true);

    try {
      await login({ email, password: data.password });
      router.push('/dashboard');
    } catch (error) {
      toast.error(handleApiError(error, 'Invalid credentials'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (data: OtpFormData) => {
    setIsLoading(true);

    try {
      await verifyOTP({ email, token: data.otpToken });

      if (requiresPasswordSetup) {
        toast.success('OTP verified successfully');
        setStep('set-password');
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      toast.error(handleApiError(error, 'Invalid OTP code'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetPassword = async (data: SetPasswordFormData) => {
    setIsLoading(true);

    try {
      await AuthService.setPassword({
        password: data.newPassword,
        confirmPassword: data.confirmPassword,
      });

      toast.success('Password set successfully! Please log in with your email and password.');
      setStep('email');
      setEmail('');
    } catch (error) {
      toast.error(handleApiError(error, 'Error setting password'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsLoading(true);

    try {
      // Use requestOTP from context
      await requestOTP({ email });
      toast.success('Verification code sent to your email');
    } catch (error) {
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
      // Use requestOTP from context
      await requestOTP({ email });
      toast.success('Verification code sent to your email');
      setStep('otp');
    } catch (error) {
      toast.error(handleApiError(error, 'Error requesting OTP'));
    } finally {
      setIsLoading(false);
    }
  };

  const resetToEmail = () => {
    setStep('email');
    setEmail('');
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
                onSubmit={handleEmailSubmit}
                loading={isLoading}
              />
            )}

            {step === 'password' && (
              <PasswordStep
                email={email}
                onSubmit={handlePasswordLogin}
                onForgotPassword={handleForgotPassword}
                onLoginWithOTP={handleLoginWithOTP}
                loading={isLoading}
                onBack={resetToEmail}
              />
            )}

            {step === 'otp' && (
              <OTPStep
                email={email}
                onSubmit={handleVerifyOTP}
                onResend={handleResendOTP}
                loading={isLoading}
                onBack={resetToEmail}
                requiresPasswordSetup={requiresPasswordSetup}
              />
            )}

            {step === 'set-password' && (
              <SetPasswordStep
                onSubmit={handleSetPassword}
                loading={isLoading}
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
