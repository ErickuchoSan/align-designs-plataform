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
    
    // Actualizar el valor completo
    const fullValue = limitedPhone ? `${countryCode} ${limitedPhone}` : '';
    onChange(fullValue);
  };

  const handleCountryCodeChange = (newCode: string) => {
    setCountryCode(newCode);
    
    // Actualizar el valor completo
    const fullValue = phoneNumber ? `${newCode} ${phoneNumber}` : '';
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
      <div className="flex gap-2">
        <CountryCodeSelector
          value={countryCode}
          onChange={handleCountryCodeChange}
          className="w-32"
        />
        <div className="flex-1">
          <input
            type="tel"
            value={formatPhoneNumber(phoneNumber)}
            onChange={(e) => handlePhoneChange(e.target.value)}
            placeholder={placeholder}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 transition-all ${
              error ? 'border-red-500' : 'border-stone-300'
            }`}
            required={required}
          />
          {error && (
            <p className="mt-1 text-sm text-red-600">{error}</p>
          )}
          {!error && phoneNumber.length > 0 && phoneNumber.length < 10 && (
            <p className="mt-1 text-sm text-amber-600">
              {10 - phoneNumber.length} digits remaining
            </p>
          )}
          {!error && phoneNumber.length === 10 && (
            <p className="mt-1 text-sm text-green-600">Valid phone number</p>
          )}
        </div>
      </div>
    </div>
  );
}