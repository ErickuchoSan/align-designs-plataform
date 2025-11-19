'use client';

import { useState } from 'react';

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  required?: boolean;
  placeholder?: string;
  showStrengthIndicator?: boolean;
}

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
  requirements: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    symbol: boolean;
  };
}

// Componente separado para evitar crear componentes durante render
const RequirementItem = ({ met, text }: { met: boolean; text: string }) => (
  <div className={`flex items-center gap-2 text-sm ${met ? 'text-green-600' : 'text-stone-500'}`}>
    <div className={`w-4 h-4 rounded-full flex items-center justify-center ${met ? 'bg-green-100' : 'bg-stone-100'}`}>
      {met ? (
        <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <div className="w-2 h-2 bg-stone-400 rounded-full" />
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
  showStrengthIndicator = true 
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  const calculateStrength = (password: string): PasswordStrength => {
    const requirements = {
      length: password.length >= 12,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      symbol: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
    };

    const score = Object.values(requirements).filter(Boolean).length;

    let label = 'Very Weak';
    let color = 'bg-red-500';

    switch (score) {
      case 0:
      case 1:
        label = 'Very Weak';
        color = 'bg-red-500';
        break;
      case 2:
        label = 'Weak';
        color = 'bg-orange-500';
        break;
      case 3:
        label = 'Fair';
        color = 'bg-yellow-500';
        break;
      case 4:
        label = 'Good';
        color = 'bg-blue-500';
        break;
      case 5:
        label = 'Strong';
        color = 'bg-green-500';
        break;
    }

    return { score, label, color, requirements };
  };

  // Calcular fuerza de contraseña directamente en lugar de usar useEffect
  const strength = calculateStrength(value);

  const getInputClassName = () => {
    const baseClass = 'w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 transition-all pr-12';
    
    if (value.length > 0) {
      if (strength.score >= 4) {
        return `${baseClass} border-green-500 bg-green-50`;
      } else if (strength.score >= 2) {
        return `${baseClass} border-amber-500 bg-amber-50`;
      } else {
        return `${baseClass} border-red-500 bg-red-50`;
      }
    }
    
    return `${baseClass} border-stone-300`;
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={getInputClassName()}
          placeholder={placeholder}
          required={required}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-stone-500 hover:text-stone-700 transition-colors"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </button>
      </div>

      {showStrengthIndicator && value.length > 0 && (
        <div className="mt-3 space-y-3">
          {/* Strength indicator */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-stone-700">Password Strength</span>
              <span className={`font-medium ${strength.score >= 4 ? 'text-green-600' : strength.score >= 2 ? 'text-amber-600' : 'text-red-600'}`}>
                {strength.label}
              </span>
            </div>
            <div className="w-full bg-stone-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${strength.color}`}
                style={{ width: `${(strength.score / 5) * 100}%` }}
              />
            </div>
          </div>

          {/* Requirements */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-stone-50 rounded-lg">
            <RequirementItem met={strength.requirements.length} text="At least 12 characters" />
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