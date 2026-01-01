'use client';

import { useState, useEffect } from 'react';
import CountryCodeSelector from './CountryCodeSelector';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  required?: boolean;
  placeholder?: string;
}

export default function PhoneInput({ value, onChange, className = '', required = false, placeholder = 'Phone number' }: PhoneInputProps) {
  const [countryCode, setCountryCode] = useState('+1');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');

  // Extraer el número sin el código de país del valor inicial
  useEffect(() => {
    if (value && !phoneNumber) {
      // Buscar el código de país en el valor
      const countryCodes = ['+1', '+52', '+44', '+34', '+54', '+57', '+51', '+56', '+55', '+49', '+33', '+39', '+81', '+86', '+91', '+61', '+82', '+7'];
      let foundCode = '+1';
      let numberPart = value;

      for (const code of countryCodes) {
        if (value.startsWith(code)) {
          foundCode = code;
          numberPart = value.substring(code.length).trim();
          break;
        }
      }

      // Use setTimeout para evitar el error de setState sincrónico
      setTimeout(() => {
        setCountryCode(foundCode);
        setPhoneNumber(numberPart);
      }, 0);
    }
  }, [value, phoneNumber]);

  const validatePhoneNumber = (number: string): boolean => {
    // Validar exactamente 10 dígitos numéricos
    const phoneRegex = /^\d{10}$/;
    return phoneRegex.test(number);
  };

  const handlePhoneChange = (newPhone: string) => {
    // Solo permitir números
    const cleanedPhone = newPhone.replace(/\D/g, '');

    // Limitar a 10 dígitos
    const limitedPhone = cleanedPhone.slice(0, 10);

    setPhoneNumber(limitedPhone);

    // Validar
    if (limitedPhone && !validatePhoneNumber(limitedPhone)) {
      setError('Phone number must be exactly 10 digits');
    } else {
      setError('');
    }

    // Actualizar el valor completo (sin espacios para el backend)
    const fullValue = limitedPhone ? `${countryCode}${limitedPhone}` : '';
    onChange(fullValue);
  };

  const handleCountryCodeChange = (newCode: string) => {
    setCountryCode(newCode);

    // Actualizar el valor completo (sin espacios para el backend)
    const fullValue = phoneNumber ? `${newCode}${phoneNumber}` : '';
    onChange(fullValue);
  };

  const formatPhoneNumber = (number: string): string => {
    // Formatear como (XXX) XXX-XXXX si es de 10 dígitos
    if (number.length === 10) {
      return `(${number.slice(0, 3)}) ${number.slice(3, 6)}-${number.slice(6)}`;
    }
    return number;
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Integrated phone input container */}
      <div className="flex items-stretch gap-0 rounded-lg border border-stone-300 focus-within:ring-2 focus-within:ring-gold-500 focus-within:border-gold-500 transition-all overflow-hidden bg-white">
        {/* Country Code Selector - no rounded corners */}
        <div className="flex-shrink-0 border-r border-stone-300">
          <CountryCodeSelector
            value={countryCode}
            onChange={handleCountryCodeChange}
            className="!rounded-none !border-0 h-full"
          />
        </div>

        {/* Phone Number Input - fills remaining space */}
        <div className="flex-1 relative">
          <input
            type="tel"
            value={formatPhoneNumber(phoneNumber)}
            onChange={(e) => handlePhoneChange(e.target.value)}
            placeholder={placeholder}
            className={`w-full h-full px-4 py-3 border-0 focus:outline-none focus:ring-0 text-navy-900 placeholder:text-stone-500 ${
              error ? 'text-red-600' : ''
            }`}
            required={required}
          />

          {/* Visual feedback icons inside input */}
          {phoneNumber.length > 0 && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {phoneNumber.length === 10 && !error && (
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {error && (
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Feedback messages below input */}
      <div className="mt-2 min-h-[20px]">
        {error && (
          <p className="text-sm text-red-600 flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}
        {!error && phoneNumber.length > 0 && phoneNumber.length < 10 && (
          <p className="text-sm text-amber-600 flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            {10 - phoneNumber.length} digits remaining
          </p>
        )}
        {!error && phoneNumber.length === 10 && (
          <p className="text-sm text-green-600 flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Valid phone number
          </p>
        )}
      </div>
    </div>
  );
}
