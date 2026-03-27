'use client';

import { useState } from 'react';
import { cn, INPUT_BASE, INPUT_VARIANTS } from '@/lib/styles';
import { CheckIcon, EyeIcon, EyeOffIcon } from '@/components/ui/icons';
import { PASSWORD_CONSTRAINTS } from '@/lib/constants/validation.constants';
import { getPasswordStrength } from '@/lib/utils/validation.utils';

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  required?: boolean;
  placeholder?: string;
  showStrengthIndicator?: boolean;
}

const RequirementItem = ({ met, text }: { met: boolean; text: string }) => (
  <div className={`flex items-center gap-2 text-sm ${met ? 'text-green-600' : 'text-[#6B6A65]'}`}>
    <div className={`w-4 h-4 rounded-full flex items-center justify-center ${met ? 'bg-green-100' : 'bg-[#F5F4F0]'}`}>
      {met ? (
        <CheckIcon size="sm" className="text-green-600" />
      ) : (
        <div className="w-2 h-2 bg-[#6B6A65] rounded-full" />
      )}
    </div>
    <span>{text}</span>
  </div>
);

export default function PasswordInput({
  value,
  onChange,
  className = '',
  required = false,
  placeholder = 'Password',
  showStrengthIndicator = true,
}: Readonly<PasswordInputProps>) {
  const [showPassword, setShowPassword] = useState(false);

  // Use centralized password strength calculation (SSOT)
  const strength = getPasswordStrength(value);

  const getInputVariant = () => {
    if (value.length > 0) {
      if (strength.score >= 4) return INPUT_VARIANTS.success;
      if (strength.score >= 2) return INPUT_VARIANTS.warning;
      return INPUT_VARIANTS.error;
    }
    return INPUT_VARIANTS.default;
  };

  const getStrengthColor = () => {
    if (strength.score >= 4) return 'text-green-600';
    if (strength.score >= 2) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <div className={cn('w-full', className)}>
      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(INPUT_BASE, getInputVariant(), 'pr-12')}
          placeholder={placeholder}
          required={required}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-[#6B6A65] hover:text-[#6B6A65] transition-colors"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? <EyeOffIcon size="lg" /> : <EyeIcon size="lg" />}
        </button>
      </div>

      {showStrengthIndicator && value.length > 0 && (
        <div className="mt-3 space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-[#6B6A65]">Password Strength</span>
              <span
                className={`font-medium ${getStrengthColor()}`}
              >
                {strength.label}
              </span>
            </div>
            <div className="w-full bg-[#F5F4F0] rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${strength.color}`}
                style={{ width: `${(strength.score / 5) * 100}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-[#F5F4F0] rounded-lg">
            <RequirementItem met={strength.requirements.length} text={`At least ${PASSWORD_CONSTRAINTS.MIN_LENGTH} characters`} />
            <RequirementItem met={strength.requirements.uppercase} text="One uppercase letter" />
            <RequirementItem met={strength.requirements.lowercase} text="One lowercase letter" />
            <RequirementItem met={strength.requirements.number} text="One number" />
            <RequirementItem met={strength.requirements.symbol} text="One special character" />
          </div>
        </div>
      )}
    </div>
  );
}
