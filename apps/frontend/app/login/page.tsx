'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { AuthService } from '@/services/auth.service';
import { handleApiError } from '@/lib/errors';
import { toast } from '@/lib/toast';
import { SetPasswordFormData } from '@/lib/schemas/auth.schema';
import SetPasswordStep from './components/SetPasswordStep';
import ForgotPasswordModal from './components/ForgotPasswordModal';

type LoginStep = 'email' | 'password' | 'otp' | 'set-password';

// ── Stitch-exact input & label styles ───────────────────────────────────────
const INPUT =
  'w-full bg-[#E9E8E4] border-0 border-b-2 border-[#D0C5B2] py-4 px-0 focus:ring-0 focus:border-[#755B00] focus:outline-none transition-all text-[#1B1C1A] placeholder:text-[#7E7665]/50 font-medium text-sm';
const LABEL = 'block text-xs font-semibold text-[#7E7665] tracking-wider uppercase mb-2';

// ── SVG Icons ────────────────────────────────────────────────────────────────
const ArchIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="3 22 21 22 12 2" />
    <line x1="12" y1="22" x2="12" y2="10" />
    <line x1="7" y1="22" x2="7" y2="14" />
    <line x1="17" y1="22" x2="17" y2="14" />
  </svg>
);
const EyeIcon = ({ open }: { open: boolean }) =>
  open ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
const BackIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
  </svg>
);
const SpinnerIcon = () => (
  <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 12a9 9 0 11-9-9" />
  </svg>
);

// ── Step dot map ─────────────────────────────────────────────────────────────
const STEP_DOT: Record<LoginStep, number> = {
  email: 0,
  password: 1,
  otp: 1,
  'set-password': 2,
};

const HEADINGS: Record<LoginStep, string> = {
  email: 'Welcome back',
  password: 'Welcome back',
  otp: 'Security check',
  'set-password': 'Set your password',
};

const SUBHEADINGS: Record<LoginStep, string> = {
  email: 'Sign in to your account to manage your atelier.',
  password: 'Enter your password to continue.',
  otp: 'Enter the verification code sent to your device.',
  'set-password': 'Create a secure password to activate your account.',
};

const BTN_LABELS: Record<LoginStep, string> = {
  email: 'Continue',
  password: 'Sign in',
  otp: 'Verify identity',
  'set-password': 'Set password',
};

// ── Page ─────────────────────────────────────────────────────────────────────
export default function LoginPage() {
  const router = useRouter();
  const { login, verifyOTP, requestOTP } = useAuth();

  const [step, setStep] = useState<LoginStep>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [requiresPasswordSetup, setRequiresPasswordSetup] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // Controlled field values
  const [emailValue, setEmailValue] = useState('');
  const [passwordValue, setPasswordValue] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otpValue, setOtpValue] = useState('');

  const resetToEmail = () => {
    setStep('email');
    setPasswordValue('');
    setOtpValue('');
    setRequiresPasswordSetup(false);
  };

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailValue.trim()) return;
    setIsLoading(true);
    try {
      const { hasPassword, requiresPasswordSetup: reqSetup } = await AuthService.checkEmail(emailValue);
      if (!hasPassword && !reqSetup) {
        toast.error('Email not found. Please check your email address.');
        return;
      }
      if (reqSetup) {
        setRequiresPasswordSetup(true);
        await requestOTP({ email: emailValue });
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

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordValue) return;
    setIsLoading(true);
    try {
      await login({ email: emailValue, password: passwordValue });
      router.push('/dashboard');
    } catch (error) {
      toast.error(handleApiError(error, 'Invalid credentials'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpValue.length !== 8) {
      toast.error('Please enter the 8-digit code');
      return;
    }
    setIsLoading(true);
    try {
      await verifyOTP({ email: emailValue, token: otpValue });
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
      await AuthService.setPassword({ password: data.newPassword, confirmPassword: data.confirmPassword });
      toast.success('Password set successfully! Please log in.');
      resetToEmail();
    } catch (error) {
      toast.error(handleApiError(error, 'Error setting password'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestOTP = async () => {
    setIsLoading(true);
    try {
      await requestOTP({ email: emailValue });
      toast.success('Verification code sent to your email');
      setStep('otp');
    } catch (error) {
      toast.error(handleApiError(error, 'Error requesting OTP'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsLoading(true);
    try {
      await requestOTP({ email: emailValue });
      toast.success('Verification code resent');
    } catch (error) {
      toast.error(handleApiError(error, 'Error resending code'));
    } finally {
      setIsLoading(false);
    }
  };

  // ── Form panel (shared desktop/mobile) ────────────────────────────────────
  const formContent = (
    <div className="w-full max-w-[440px] space-y-10">
      {/* Header */}
      <header className="space-y-3">
        <h1 className="text-4xl md:text-5xl font-bold text-[#1A2744] tracking-tight leading-tight">
          {HEADINGS[step]}
        </h1>
        <p className="text-[#515E7E] text-base">{SUBHEADINGS[step]}</p>
      </header>

      {/* ── Email step ── */}
      {step === 'email' && (
        <form className="space-y-8" onSubmit={handleEmailSubmit}>
          <div className="space-y-1">
            <label htmlFor="login-email" className={LABEL}>Email address</label>
            <input
              id="login-email"
              type="email"
              required
              autoFocus
              autoComplete="email"
              placeholder="name@atelier.com"
              value={emailValue}
              onChange={(e) => setEmailValue(e.target.value)}
              className={INPUT}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#C9A84C] text-[#241A00] py-5 rounded-xl font-bold text-lg shadow-sm hover:shadow-md hover:brightness-105 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? <SpinnerIcon /> : 'Continue'}
          </button>
        </form>
      )}

      {/* ── Password step ── */}
      {step === 'password' && (
        <form className="space-y-8" onSubmit={handlePasswordSubmit}>
          <div className="space-y-1">
            <label htmlFor="login-password" className={LABEL}>Password</label>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                required
                autoFocus
                placeholder="••••••••"
                value={passwordValue}
                onChange={(e) => setPasswordValue(e.target.value)}
                className={INPUT}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 top-1/2 -translate-y-1/2 text-[#7E7665] hover:text-[#755B00] p-2 transition-colors"
                aria-label="Toggle password visibility"
              >
                <EyeIcon open={showPassword} />
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between py-2">
            <button
              type="button"
              onClick={handleRequestOTP}
              disabled={isLoading}
              className="text-sm font-semibold text-[#755B00] hover:text-[#C9A84C] transition-colors disabled:opacity-50"
            >
              Login with code
            </button>
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="text-sm font-medium text-[#515E7E] hover:text-[#755B00] transition-colors underline decoration-[#D0C5B2]/30 underline-offset-4"
            >
              Forgot password?
            </button>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#C9A84C] text-[#241A00] py-5 rounded-xl font-bold text-lg shadow-sm hover:shadow-md hover:brightness-105 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? <SpinnerIcon /> : 'Sign in'}
          </button>
        </form>
      )}

      {/* ── OTP step ── */}
      {step === 'otp' && (
        <form className="space-y-8" onSubmit={handleOtpSubmit}>
          <p className="text-sm text-[#7E7665]">
            An 8-digit code was sent to{' '}
            <span className="font-semibold text-[#1B1C1A]">{emailValue}</span>.
            {requiresPasswordSetup && ' After verifying you\'ll set your password.'}
          </p>
          <div className="space-y-1">
            <label htmlFor="login-otp" className={LABEL}>Verification code</label>
            <input
              id="login-otp"
              type="text"
              inputMode="numeric"
              maxLength={8}
              autoFocus
              placeholder="00000000"
              value={otpValue}
              onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ''))}
              className={`${INPUT} text-center text-3xl font-mono tracking-[0.5em]`}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#C9A84C] text-[#241A00] py-5 rounded-xl font-bold text-lg shadow-sm hover:shadow-md hover:brightness-105 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? <SpinnerIcon /> : 'Verify identity'}
          </button>
          <button
            type="button"
            onClick={handleResendOTP}
            disabled={isLoading}
            className="w-full text-sm font-semibold text-[#755B00] hover:text-[#C9A84C] transition-colors disabled:opacity-50"
          >
            Resend code
          </button>
        </form>
      )}

      {/* ── Set password step ── */}
      {step === 'set-password' && (
        <SetPasswordStep onSubmit={handleSetPassword} loading={isLoading} />
      )}

      {/* Footer */}
      <footer className="pt-2 flex flex-col items-center gap-6">
        <p className="text-sm text-[#7E7665]">
          {step === 'email' ? (
            <>
              Don&apos;t have an account?{' '}
              <span className="text-[#1A2744] font-bold hover:text-[#755B00] cursor-default transition-colors">
                Request access
              </span>
            </>
          ) : (
            <button
              type="button"
              onClick={resetToEmail}
              className="text-[#515E7E] hover:text-[#755B00] transition-colors"
            >
              ← Use a different email
            </button>
          )}
        </p>
        {/* Step dots */}
        <div className="flex gap-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === STEP_DOT[step] ? 'bg-[#C9A84C]' : 'bg-[#D0C5B2]'
              }`}
            />
          ))}
        </div>
      </footer>
    </div>
  );

  return (
    <>
      <main className="flex min-h-screen overflow-hidden">

        {/* ── LEFT PANEL: architectural dark column ── */}
        <section className="hidden lg:flex w-[45%] bg-[#0F0F0D] relative flex-col justify-between p-12 overflow-hidden flex-shrink-0">
          {/* Atmospheric gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0F0F0D]/0 via-[#0F0F0D]/20 to-[#0F0F0D]/80 pointer-events-none" />
          {/* Subtle grid texture */}
          <div
            className="absolute inset-0 opacity-[0.035]"
            style={{
              backgroundImage:
                'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
              backgroundSize: '60px 60px',
            }}
          />

          {/* Logo — top */}
          <div className="relative z-10 flex items-center gap-2.5">
            <ArchIcon className="text-[#C9A84C]" />
            <span className="font-bold text-xl text-[#FFE08F] tracking-tight uppercase">
              Align Designs
            </span>
          </div>

          {/* Quote — bottom */}
          <div className="relative z-10 max-w-md">
            <div className="mb-8 h-1 w-12 bg-[#C9A84C] rounded-full" />
            <blockquote className="text-white text-2xl font-bold leading-snug italic">
              &ldquo;Architecture is the learned game, correct and magnificent, of forms assembled in the light.&rdquo;
            </blockquote>
            <p className="mt-5 text-[#E6C364] text-sm tracking-widest uppercase font-semibold">
              Le Corbusier
            </p>
          </div>
        </section>

        {/* ── RIGHT PANEL: form ── */}
        <section className="w-full lg:w-[55%] bg-[#FAF9F5] flex flex-col justify-center items-center px-6 md:px-24 relative min-h-screen">

          {/* Mobile logo — top left */}
          <div className="lg:hidden absolute top-8 left-8 flex items-center gap-2">
            <ArchIcon className="text-[#755B00]" />
            <span className="font-bold text-lg text-[#515E7E] tracking-tight uppercase">Align</span>
          </div>

          {/* Back button — appears on non-email steps */}
          {step !== 'email' && (
            <div className="absolute top-8 right-8 lg:left-24 lg:right-auto">
              <button
                onClick={resetToEmail}
                className="flex items-center gap-2 text-[#515E7E] hover:text-[#755B00] transition-colors font-medium text-sm"
              >
                <BackIcon />
                <span>Back</span>
              </button>
            </div>
          )}

          {/* Form */}
          <div className="w-full flex justify-center py-20 lg:py-0">
            {formContent}
          </div>
        </section>
      </main>

      <ForgotPasswordModal
        show={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
        initialEmail={emailValue}
      />
    </>
  );
}
