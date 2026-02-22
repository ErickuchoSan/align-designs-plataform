'use client';

import { useState } from 'react';
import { cn, INPUT_BASE, INPUT_VARIANTS } from '@/lib/styles';
import { CheckCircleIcon, ErrorCircleIcon, WarningIcon, SpinnerIcon } from '@/components/ui/icons';

interface EmailInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  required?: boolean;
  placeholder?: string;
}

const businessDomains = [
  'microsoft.com', 'google.com', 'apple.com', 'amazon.com', 'meta.com',
  'linkedin.com', 'twitter.com', 'facebook.com', 'instagram.com', 'whatsapp.com'
];

export default function EmailInput({ value, onChange, className = '', required = false, placeholder = 'Email address' }: EmailInputProps) {
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  const validateEmail = (email: string): { isValid: boolean; error?: string; warning?: string } => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!email) {
      return { isValid: false, error: required ? 'Email is required' : undefined };
    }

    if (!emailRegex.test(email)) {
      return { isValid: false, error: 'Please enter a valid email address' };
    }

    const [localPart, domain] = email.split('@');

    if (localPart.length > 64) {
      return { isValid: false, error: 'Username is too long (max 64 characters)' };
    }

    if (domain.length > 255) {
      return { isValid: false, error: 'Domain is too long (max 255 characters)' };
    }

    const localPartRegex = /^[a-zA-Z0-9._%+-]+$/;
    if (!localPartRegex.test(localPart)) {
      return { isValid: false, error: 'Username contains invalid characters' };
    }

    if (localPart.startsWith('.') || localPart.endsWith('.')) {
      return { isValid: false, error: 'Username cannot start or end with a dot' };
    }

    if (localPart.includes('..')) {
      return { isValid: false, error: 'Username cannot contain consecutive dots' };
    }

    const domainParts = domain.split('.');
    if (domainParts.length < 2) {
      return { isValid: false, error: 'Domain must have at least one dot' };
    }

    const tld = domainParts[domainParts.length - 1];
    if (tld.length < 2 || tld.length > 6) {
      return { isValid: false, error: 'Top-level domain must be 2-6 characters' };
    }

    const suspiciousDomains = ['tempmail.com', '10minutemail.com', 'guerrillamail.com', 'mailinator.com'];
    if (suspiciousDomains.some(d => domain.toLowerCase().includes(d))) {
      return { isValid: true, warning: 'This appears to be a temporary email address' };
    }

    if (businessDomains.includes(domain.toLowerCase())) {
      return { isValid: true, warning: 'Business email detected - please ensure this is your email' };
    }

    return { isValid: true };
  };

  const handleChange = (newValue: string) => {
    onChange(newValue);

    if (newValue.length > 3) {
      setIsValidating(true);
      setTimeout(() => {
        const result = validateEmail(newValue);
        setError(result.error || '');
        setWarning(result.warning || '');
        setIsValidating(false);
      }, 300);
    } else {
      setError('');
      setWarning('');
    }
  };

  const getInputVariant = () => {
    if (error) return INPUT_VARIANTS.error;
    if (warning) return INPUT_VARIANTS.warning;
    if (value && !error && !isValidating) return INPUT_VARIANTS.success;
    return INPUT_VARIANTS.default;
  };

  const getIcon = () => {
    if (isValidating) {
      return <SpinnerIcon size="md" className="text-gold-600" />;
    }
    if (error) {
      return <ErrorCircleIcon size="md" className="text-red-500" />;
    }
    if (warning) {
      return <WarningIcon size="md" className="text-amber-500" />;
    }
    if (value && !error) {
      return <CheckCircleIcon size="md" className="text-green-500" />;
    }
    return null;
  };

  return (
    <div className={cn('w-full', className)}>
      <div className="relative">
        <input
          type="email"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          className={cn(INPUT_BASE, getInputVariant())}
          placeholder={placeholder}
          required={required}
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          {getIcon()}
        </div>
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
          <ErrorCircleIcon size="md" />
          {error}
        </p>
      )}

      {warning && (
        <p className="mt-1 text-sm text-amber-600 flex items-center gap-1">
          <WarningIcon size="md" />
          {warning}
        </p>
      )}

      {!error && !warning && value && (
        <p className="mt-1 text-sm text-green-600 flex items-center gap-1">
          <CheckCircleIcon size="md" />
          Email address is valid
        </p>
      )}
    </div>
  );
}
