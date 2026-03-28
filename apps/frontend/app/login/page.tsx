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
  const [requiresPasswordSetup, setRequiresPasswordSetup] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
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
      await requestOTP({ email });
      toast.success('Verification code sent to your email');
    } catch (error) {
      toast.error(handleApiError(error, 'Error resending code'));
    } finally {
      setIsLoading(false);
    }
  };

  const resetToEmail = () => {
    setStep('email');
    setEmail('');
    setRequiresPasswordSetup(false);
  };

  const stepTitles: Record<LoginStep, { heading: string; subheading: string }> = {
    email: { heading: 'Welcome back', subheading: 'Access your project atelier and blueprints.' },
    password: { heading: 'Welcome back', subheading: `Logging in as ${email}` },
    otp: { heading: 'Security Check', subheading: 'Enter the verification code sent to your device.' },
    'set-password': { heading: 'Set Password', subheading: 'Create a secure password for your account.' },
  };

  const { heading, subheading } = stepTitles[step];

  const formPanel = (
    <div className="w-full max-w-sm mx-auto">
      {/* Heading */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-[#1B1C1A]">{heading}</h1>
        <p className="text-sm text-[#6B6A65] mt-1">{subheading}</p>
      </div>

      {/* Steps */}
      {step === 'email' && (
        <EmailStep email={email} onSubmit={handleEmailSubmit} loading={isLoading} />
      )}
      {step === 'password' && (
        <PasswordStep
          email={email}
          onSubmit={handlePasswordLogin}
          onForgotPassword={() => setShowForgotPassword(true)}
          onLoginWithOTP={async () => {
            setIsLoading(true);
            try {
              await requestOTP({ email });
              toast.success('Verification code sent to your email');
              setStep('otp');
            } catch (error) {
              toast.error(handleApiError(error, 'Error requesting OTP'));
            } finally {
              setIsLoading(false);
            }
          }}
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
        <SetPasswordStep onSubmit={handleSetPassword} loading={isLoading} />
      )}

      {/* Footer */}
      <p className="mt-10 text-center text-[10px] font-semibold tracking-[0.2em] uppercase text-[#A09B90]">
        Trouble logging in?{' '}
        <span className="text-[#6B6A65] cursor-pointer hover:underline">Contact support</span>
      </p>
    </div>
  );

  return (
    <>
      {/* ── MOBILE layout ─────────────────────────────────────────── */}
      <div className="lg:hidden min-h-screen flex flex-col bg-[#0F0F0D]">

        {/* Dark top brand area */}
        <div className="relative flex-shrink-0 px-8 pt-12 pb-10 flex items-start gap-4">
          {/* Vertical brand text on left edge */}
          <div
            className="flex-shrink-0 flex flex-col items-center gap-0.5"
            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
          >
            <span className="text-white/20 text-[9px] font-semibold tracking-[0.3em] uppercase leading-none">
              Align Designs
            </span>
          </div>

          {/* Right brand block */}
          <div>
            <p className="text-white/40 text-[10px] tracking-[0.3em] uppercase font-semibold">
              Architecture Studio
            </p>
          </div>
        </div>

        {/* White card rising from bottom */}
        <div className="flex-1 bg-white rounded-t-3xl px-8 pt-10 pb-12">
          {/* Hero "ALIGN" gold text */}
          <div className="mb-8 text-center">
            <p className="text-[#C9A84C] font-black text-5xl tracking-[0.12em] uppercase leading-none">
              Align
            </p>
            <div className="w-10 h-0.5 bg-[#C9A84C] mx-auto mt-2 rounded-full" />
          </div>

          {formPanel}
        </div>
      </div>

      {/* ── DESKTOP layout: split-screen ──────────────────────────── */}
      <div className="hidden lg:flex min-h-screen">

        {/* Left dark column ~42% */}
        <div className="w-[42%] bg-[#0F0F0D] flex flex-col relative overflow-hidden flex-shrink-0">
          {/* Subtle diagonal texture */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)',
              backgroundSize: '14px 14px',
            }}
          />

          {/* Brand — top left */}
          <div className="relative z-10 px-12 pt-12">
            <p className="text-white font-bold text-sm tracking-[0.25em] uppercase">
              Align Designs
            </p>
            <p className="text-white/25 text-[10px] tracking-[0.3em] uppercase mt-1">
              Architectural Excellence
            </p>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Quote — bottom */}
          <div className="relative z-10 px-12 pb-14">
            <blockquote className="text-white/50 text-xl font-light leading-relaxed">
              &ldquo;Precision is the soul<br />of permanent beauty.&rdquo;
            </blockquote>
            <p className="text-white/20 text-[10px] tracking-[0.25em] uppercase mt-6 font-semibold">
              Partnering with The Monolith Group
            </p>
          </div>
        </div>

        {/* Right form column ~58% */}
        <div className="flex-1 bg-[#F5F4F0] flex items-center justify-center px-16 py-12">
          {formPanel}
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
