'use client';

import { useState } from 'react';
import { cn, INPUT_BASE, INPUT_VARIANTS } from '@/lib/styles';
import { CheckCircleIcon, ErrorCircleIcon, WarningIcon, SpinnerIcon } from '@/components/ui/icons';
import {
  EMAIL_CONSTRAINTS,
  EMAIL_REGEX,
  LOCAL_PART_REGEX,
  SUSPICIOUS_EMAIL_DOMAINS,
  BUSINESS_EMAIL_DOMAINS,
} from '@/lib/constants/validation.constants';

interface EmailInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  required?: boolean;
  placeholder?: string;
  id?: string;
}

export default function EmailInput({ value, onChange, className = '', required = false, placeholder = 'Email address', id }: Readonly<EmailInputProps>) {
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  const validateEmail = (email: string): { isValid: boolean; error?: string; warning?: string } => {
    if (!email) {
      return { isValid: false, error: required ? 'Email is required' : undefined };
    }

    if (!EMAIL_REGEX.test(email)) {
      return { isValid: false, error: 'Please enter a valid email address' };
    }

    const [localPart, domain] = email.split('@');

    if (localPart.length > EMAIL_CONSTRAINTS.LOCAL_PART_MAX_LENGTH) {
      return { isValid: false, error: `Username is too long (max ${EMAIL_CONSTRAINTS.LOCAL_PART_MAX_LENGTH} characters)` };
    }

    if (domain.length > EMAIL_CONSTRAINTS.DOMAIN_MAX_LENGTH) {
      return { isValid: false, error: `Domain is too long (max ${EMAIL_CONSTRAINTS.DOMAIN_MAX_LENGTH} characters)` };
    }

    if (!LOCAL_PART_REGEX.test(localPart)) {
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

    const tld = domainParts.at(-1)!;
    if (tld.length < EMAIL_CONSTRAINTS.TLD_MIN_LENGTH || tld.length > EMAIL_CONSTRAINTS.TLD_MAX_LENGTH) {
      return { isValid: false, error: `Top-level domain must be ${EMAIL_CONSTRAINTS.TLD_MIN_LENGTH}-${EMAIL_CONSTRAINTS.TLD_MAX_LENGTH} characters` };
    }

    const domainLower = domain.toLowerCase();
    if (SUSPICIOUS_EMAIL_DOMAINS.some(d => domainLower.includes(d))) {
      return { isValid: true, warning: 'This appears to be a temporary email address' };
    }

    if (BUSINESS_EMAIL_DOMAINS.has(domainLower)) {
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
          id={id}
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
