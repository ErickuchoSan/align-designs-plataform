'use client';

import { useState, useEffect } from 'react';
import CountryCodeSelector from './CountryCodeSelector';
import { cn } from '@/lib/styles';
import { CheckIcon, ErrorCircleIcon, WarningIcon } from '@/components/ui/icons';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  required?: boolean;
  placeholder?: string;
  id?: string;
}

export default function PhoneInput({
  value,
  onChange,
  className = '',
  required = false,
  placeholder = 'Phone number',
  id,
}: Readonly<PhoneInputProps>) {
  const [countryCode, setCountryCode] = useState('+1');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (value && !phoneNumber) {
      const countryCodes = [
        '+1', '+52', '+44', '+34', '+54', '+57', '+51', '+56', '+55', '+49', '+33', '+39', '+81', '+86', '+91', '+61',
        '+82', '+7',
      ];
      let foundCode = '+1';
      let numberPart = value;

      for (const code of countryCodes) {
        if (value.startsWith(code)) {
          foundCode = code;
          numberPart = value.substring(code.length).trim();
          break;
        }
      }

      setTimeout(() => {
        setCountryCode(foundCode);
        setPhoneNumber(numberPart);
      }, 0);
    }
  }, [value, phoneNumber]);

  const validatePhoneNumber = (number: string): boolean => {
    const phoneRegex = /^\d{10}$/;
    return phoneRegex.test(number);
  };

  const handlePhoneChange = (newPhone: string) => {
    const cleanedPhone = newPhone.replaceAll(/\D/g, '');
    const limitedPhone = cleanedPhone.slice(0, 10);

    setPhoneNumber(limitedPhone);

    if (limitedPhone && !validatePhoneNumber(limitedPhone)) {
      setError('Phone number must be exactly 10 digits');
    } else {
      setError('');
    }

    const fullValue = limitedPhone ? `${countryCode}${limitedPhone}` : '';
    onChange(fullValue);
  };

  const handleCountryCodeChange = (newCode: string) => {
    setCountryCode(newCode);
    const fullValue = phoneNumber ? `${newCode}${phoneNumber}` : '';
    onChange(fullValue);
  };

  const formatPhoneNumber = (number: string): string => {
    if (number.length === 10) {
      return `(${number.slice(0, 3)}) ${number.slice(3, 6)}-${number.slice(6)}`;
    }
    return number;
  };

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-stretch gap-0 rounded-lg border border-[#D0C5B2]/20 focus-within:ring-2 focus-within:ring-[#C9A84C] focus-within:border-[#C9A84C] transition-all overflow-hidden bg-white">
        <div className="flex-shrink-0 border-r border-[#D0C5B2]/20">
          <CountryCodeSelector
            value={countryCode}
            onChange={handleCountryCodeChange}
            className="!rounded-none !border-0 h-full"
          />
        </div>

        <div className="flex-1 relative">
          <input
            id={id}
            type="tel"
            value={formatPhoneNumber(phoneNumber)}
            onChange={(e) => handlePhoneChange(e.target.value)}
            placeholder={placeholder}
            className={cn(
              'w-full h-full px-4 py-3 border-0 focus:outline-none focus:ring-0 text-[#1B1C1A] placeholder:text-[#6B6A65]',
              error && 'text-red-600'
            )}
            required={required}
          />

          {phoneNumber.length > 0 && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {phoneNumber.length === 10 && !error && <CheckIcon size="lg" className="text-green-600" />}
              {error && <ErrorCircleIcon size="lg" className="text-red-600" />}
            </div>
          )}
        </div>
      </div>

      <div className="mt-2 min-h-[20px]">
        {error && (
          <p className="text-sm text-red-600 flex items-center gap-1.5">
            <ErrorCircleIcon size="md" />
            {error}
          </p>
        )}
        {!error && phoneNumber.length > 0 && phoneNumber.length < 10 && (
          <p className="text-sm text-amber-600 flex items-center gap-1.5">
            <WarningIcon size="md" />
            {10 - phoneNumber.length} digits remaining
          </p>
        )}
        {!error && phoneNumber.length === 10 && (
          <p className="text-sm text-green-600 flex items-center gap-1.5">
            <CheckIcon size="md" />
            Valid phone number
          </p>
        )}
      </div>
    </div>
  );
}
