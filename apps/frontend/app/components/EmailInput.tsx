'use client';

import { useState } from 'react';

interface EmailInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  required?: boolean;
  placeholder?: string;
}

// Lista de dominios comunes válidos (se puede usar en el futuro)
// const validDomains = [
//   'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com',
//   'aol.com', 'protonmail.com', 'zoho.com', 'mail.com', 'yandex.com',
//   'gmx.com', 'fastmail.com', 'tutanota.com', 'pm.me'
// ];

// Dominios de empresas comunes
const businessDomains = [
  'microsoft.com', 'google.com', 'apple.com', 'amazon.com', 'meta.com',
  'linkedin.com', 'twitter.com', 'facebook.com', 'instagram.com', 'whatsapp.com'
];

export default function EmailInput({ value, onChange, className = '', required = false, placeholder = 'Email address' }: EmailInputProps) {
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  const validateEmail = (email: string): { isValid: boolean; error?: string; warning?: string } => {
    // Validación básica de formato
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    
    if (!email) {
      return { isValid: false, error: required ? 'Email is required' : undefined };
    }

    if (!emailRegex.test(email)) {
      return { isValid: false, error: 'Please enter a valid email address' };
    }

    // Separar usuario y dominio
    const [localPart, domain] = email.split('@');

    // Validar longitud
    if (localPart.length > 64) {
      return { isValid: false, error: 'Username is too long (max 64 characters)' };
    }

    if (domain.length > 255) {
      return { isValid: false, error: 'Domain is too long (max 255 characters)' };
    }

    // Validar caracteres permitidos en el usuario
    const localPartRegex = /^[a-zA-Z0-9._%+-]+$/;
    if (!localPartRegex.test(localPart)) {
      return { isValid: false, error: 'Username contains invalid characters' };
    }

    // Validar que no empiece o termine con punto
    if (localPart.startsWith('.') || localPart.endsWith('.')) {
      return { isValid: false, error: 'Username cannot start or end with a dot' };
    }

    // Validar que no tenga puntos consecutivos
    if (localPart.includes('..')) {
      return { isValid: false, error: 'Username cannot contain consecutive dots' };
    }

    // Validar dominio
    const domainParts = domain.split('.');
    if (domainParts.length < 2) {
      return { isValid: false, error: 'Domain must have at least one dot' };
    }

    const tld = domainParts[domainParts.length - 1];
    if (tld.length < 2 || tld.length > 6) {
      return { isValid: false, error: 'Top-level domain must be 2-6 characters' };
    }

    // Verificar si es un dominio temporal o sospechoso
    const suspiciousDomains = ['tempmail.com', '10minutemail.com', 'guerrillamail.com', 'mailinator.com'];
    if (suspiciousDomains.some(d => domain.toLowerCase().includes(d))) {
      return { isValid: true, warning: 'This appears to be a temporary email address' };
    }

    // Verificar si es un dominio de negocio
    if (businessDomains.includes(domain.toLowerCase())) {
      return { isValid: true, warning: 'Business email detected - please ensure this is your email' };
    }

    return { isValid: true };
  };

  const handleChange = (newValue: string) => {
    onChange(newValue);
    
    // Validar en tiempo real después de 3 caracteres
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

  const getInputClassName = () => {
    const baseClass = 'w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 transition-all';
    
    if (error) {
      return `${baseClass} border-red-500 bg-red-50`;
    } else if (warning) {
      return `${baseClass} border-amber-500 bg-amber-50`;
    } else if (value && !error && !isValidating) {
      return `${baseClass} border-green-500 bg-green-50`;
    }
    
    return `${baseClass} border-stone-300`;
  };

  const getIcon = () => {
    if (isValidating) {
      return (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gold-600"></div>
      );
    }
    
    if (error) {
      return (
        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }
    
    if (warning) {
      return (
        <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      );
    }
    
    if (value && !error) {
      return (
        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }
    
    return null;
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="relative">
        <input
          type="email"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          className={getInputClassName()}
          placeholder={placeholder}
          required={required}
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          {getIcon()}
        </div>
      </div>
      
      {error && (
        <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </p>
      )}
      
      {warning && (
        <p className="mt-1 text-sm text-amber-600 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {warning}
        </p>
      )}
      
      {!error && !warning && value && (
        <p className="mt-1 text-sm text-green-600 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Email address is valid
        </p>
      )}
    </div>
  );
}