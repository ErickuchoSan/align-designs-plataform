import {
  parsePhoneNumber,
  isValidPhoneNumber,
  CountryCode,
} from 'libphonenumber-js';

/**
 * Phone number validation utilities with international support
 */
export class PhoneValidationUtils {
  /**
   * Validates if a phone number is valid for a given country
   * Supports international phone numbers using libphonenumber-js
   *
   * @param phone - Phone number in any format (with or without country code)
   * @param countryCode - ISO 3166-1 alpha-2 country code (e.g., 'US', 'MX', 'GB')
   * @returns boolean indicating if the phone number is valid
   */
  static validatePhoneNumber(
    phone: string,
    countryCode?: CountryCode,
  ): boolean {
    try {
      // Check if phone number includes country code
      if (phone.startsWith('+')) {
        return isValidPhoneNumber(phone);
      }

      // If no country code provided and number doesn't start with +, try default validation
      if (!countryCode) {
        // Try common North American format (10 digits)
        const digitsOnly = phone.replace(/\D/g, '');
        if (/^\d{10}$/.test(digitsOnly)) {
          return true;
        }
        return false;
      }

      // Validate with specific country code
      return isValidPhoneNumber(phone, countryCode);
    } catch (error) {
      return false;
    }
  }

  /**
   * Formats phone number to E.164 international format
   * @param phone - Phone number in any format
   * @param countryCode - ISO 3166-1 alpha-2 country code (e.g., 'US', 'MX')
   * @returns Phone number in E.164 format (e.g., '+14155552671')
   */
  static formatToE164(phone: string, countryCode?: CountryCode): string | null {
    try {
      // If already in E.164 format, validate and return
      if (phone.startsWith('+')) {
        const parsed = parsePhoneNumber(phone);
        return parsed ? parsed.number : null;
      }

      // If no country code, try US/CA default
      if (!countryCode) {
        const digitsOnly = phone.replace(/\D/g, '');
        if (/^\d{10}$/.test(digitsOnly)) {
          return `+1${digitsOnly}`;
        }
        return null;
      }

      // Parse with country code
      const parsed = parsePhoneNumber(phone, countryCode);
      return parsed ? parsed.number : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Gets comprehensive phone number information
   */
  static getPhoneInfo(phone: string, countryCode?: CountryCode) {
    try {
      const parsed = countryCode
        ? parsePhoneNumber(phone, countryCode)
        : parsePhoneNumber(phone);

      if (!parsed) {
        return null;
      }

      return {
        number: parsed.number, // E.164 format
        country: parsed.country,
        countryCallingCode: parsed.countryCallingCode,
        nationalNumber: parsed.nationalNumber,
        isValid: parsed.isValid(),
        isPossible: parsed.isPossible(),
        type: parsed.getType(), // 'MOBILE', 'FIXED_LINE', etc.
        formatted: {
          international: parsed.formatInternational(),
          national: parsed.formatNational(),
          e164: parsed.format('E.164'),
          rfc3966: parsed.format('RFC3966'), // tel:+1-415-555-2671
        },
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Validates and formats phone number in one call
   */
  static validateAndFormat(
    phone: string,
    countryCode?: CountryCode,
  ): { isValid: boolean; formatted: string | null; error?: string } {
    try {
      if (!phone || phone.trim() === '') {
        return {
          isValid: false,
          formatted: null,
          error: 'Phone number is required',
        };
      }

      const isValid = this.validatePhoneNumber(phone, countryCode);

      if (!isValid) {
        return {
          isValid: false,
          formatted: null,
          error: `Invalid phone number${countryCode ? ` for country ${countryCode}` : ''}`,
        };
      }

      const formatted = this.formatToE164(phone, countryCode);

      return {
        isValid: true,
        formatted,
      };
    } catch (error) {
      return {
        isValid: false,
        formatted: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Extracts country code and phone number
   */
  static extractCountryCodeAndNumber(fullPhone: string): {
    countryCode: string;
    phoneNumber: string;
  } {
    // Common country codes
    const countryCodes = [
      '+1',
      '+7',
      '+20',
      '+27',
      '+30',
      '+31',
      '+32',
      '+33',
      '+34',
      '+36',
      '+39',
      '+40',
      '+41',
      '+43',
      '+44',
      '+45',
      '+46',
      '+47',
      '+48',
      '+49',
      '+51',
      '+52',
      '+53',
      '+54',
      '+55',
      '+56',
      '+57',
      '+58',
      '+60',
      '+61',
      '+62',
      '+63',
      '+64',
      '+65',
      '+66',
      '+81',
      '+82',
      '+84',
      '+86',
      '+90',
      '+91',
      '+92',
      '+93',
      '+94',
      '+95',
      '+98',
      '+212',
      '+213',
      '+216',
      '+218',
      '+220',
      '+221',
      '+222',
      '+223',
      '+224',
      '+225',
      '+226',
      '+227',
      '+228',
      '+229',
      '+230',
      '+231',
      '+232',
      '+233',
      '+234',
      '+235',
      '+236',
      '+237',
      '+238',
      '+239',
      '+240',
      '+241',
      '+242',
      '+243',
      '+244',
      '+245',
      '+246',
      '+248',
      '+249',
      '+250',
      '+251',
      '+252',
      '+253',
      '+254',
      '+255',
      '+256',
      '+257',
      '+258',
      '+260',
      '+261',
      '+262',
      '+263',
      '+264',
      '+265',
      '+266',
      '+267',
      '+268',
      '+269',
      '+290',
      '+291',
      '+297',
      '+298',
      '+299',
      '+350',
      '+351',
      '+352',
      '+353',
      '+354',
      '+355',
      '+356',
      '+357',
      '+358',
      '+359',
      '+370',
      '+371',
      '+372',
      '+373',
      '+374',
      '+375',
      '+376',
      '+377',
      '+378',
      '+380',
      '+381',
      '+382',
      '+383',
      '+385',
      '+386',
      '+387',
      '+389',
      '+420',
      '+421',
      '+423',
      '+500',
      '+501',
      '+502',
      '+503',
      '+504',
      '+505',
      '+506',
      '+507',
      '+508',
      '+509',
      '+590',
      '+591',
      '+592',
      '+593',
      '+594',
      '+595',
      '+596',
      '+597',
      '+598',
      '+599',
      '+670',
      '+672',
      '+673',
      '+674',
      '+675',
      '+676',
      '+677',
      '+678',
      '+679',
      '+680',
      '+681',
      '+682',
      '+683',
      '+684',
      '+685',
      '+686',
      '+687',
      '+688',
      '+689',
      '+690',
      '+691',
      '+692',
      '+800',
      '+808',
      '+850',
      '+852',
      '+853',
      '+855',
      '+856',
      '+870',
      '+878',
      '+880',
      '+881',
      '+882',
      '+883',
      '+886',
      '+888',
      '+960',
      '+961',
      '+962',
      '+963',
      '+964',
      '+965',
      '+966',
      '+967',
      '+968',
      '+970',
      '+971',
      '+972',
      '+973',
      '+974',
      '+975',
      '+976',
      '+977',
      '+979',
      '+992',
      '+993',
      '+994',
      '+995',
      '+996',
      '+998',
    ];

    // Sort by length (descending) to match longer codes first
    const sortedCodes = countryCodes.sort((a, b) => b.length - a.length);

    for (const code of sortedCodes) {
      if (fullPhone.startsWith(code)) {
        const phoneNumber = fullPhone.substring(code.length).trim();
        return { countryCode: code, phoneNumber };
      }
    }

    // Default to +1 if no country code found
    return { countryCode: '+1', phoneNumber: fullPhone };
  }
}

/**
 * Email validation utilities
 */
export class EmailValidationUtils {
  /**
   * Comprehensive email validation
   */
  static validateEmail(email: string): { isValid: boolean; error?: string } {
    if (!email) {
      return { isValid: false, error: 'Email is required' };
    }

    // Basic format validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return { isValid: false, error: 'Invalid email format' };
    }

    // Split into local part and domain
    const [localPart, domain] = email.split('@');

    // Length validation
    if (localPart.length > 64) {
      return { isValid: false, error: 'Username too long (max 64 characters)' };
    }

    if (domain.length > 255) {
      return { isValid: false, error: 'Domain too long (max 255 characters)' };
    }

    // Local part validation
    const localPartRegex = /^[a-zA-Z0-9._%+-]+$/;
    if (!localPartRegex.test(localPart)) {
      return { isValid: false, error: 'Invalid characters in username' };
    }

    // Check for dots at start/end
    if (localPart.startsWith('.') || localPart.endsWith('.')) {
      return {
        isValid: false,
        error: 'Username cannot start or end with a dot',
      };
    }

    // Check for consecutive dots
    if (localPart.includes('..')) {
      return {
        isValid: false,
        error: 'Username cannot contain consecutive dots',
      };
    }

    // Domain validation
    const domainParts = domain.split('.');
    if (domainParts.length < 2) {
      return { isValid: false, error: 'Invalid domain format' };
    }

    const tld = domainParts[domainParts.length - 1];
    if (tld.length < 2 || tld.length > 6) {
      return { isValid: false, error: 'Invalid top-level domain' };
    }

    // Check for suspicious domains (exact match to prevent bypass)
    const suspiciousDomains = [
      'tempmail.com',
      '10minutemail.com',
      'guerrillamail.com',
      'mailinator.com',
    ];
    const domainLower = domain.toLowerCase();
    if (suspiciousDomains.includes(domainLower)) {
      return {
        isValid: false,
        error: 'Temporary email addresses are not allowed',
      };
    }

    return { isValid: true };
  }

  /**
   * Check if email is from a business domain
   */
  static isBusinessEmail(email: string): boolean {
    const businessDomains = [
      'microsoft.com',
      'google.com',
      'apple.com',
      'amazon.com',
      'meta.com',
      'linkedin.com',
      'twitter.com',
      'facebook.com',
      'instagram.com',
      'whatsapp.com',
    ];

    const domain = email.split('@')[1]?.toLowerCase();
    return businessDomains.includes(domain);
  }
}

/**
 * Password validation utilities
 */
export class PasswordValidationUtils {
  /**
   * Password strength calculation
   */
  static calculatePasswordStrength(password: string): {
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
  } {
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
  }

  /**
   * Validate password against security requirements
   */
  static validatePassword(password: string): {
    isValid: boolean;
    error?: string;
  } {
    if (!password) {
      return { isValid: false, error: 'Password is required' };
    }

    if (password.length < 12) {
      return {
        isValid: false,
        error: 'Password must be at least 12 characters long',
      };
    }

    if (!/[A-Z]/.test(password)) {
      return {
        isValid: false,
        error: 'Password must contain at least one uppercase letter',
      };
    }

    if (!/[a-z]/.test(password)) {
      return {
        isValid: false,
        error: 'Password must contain at least one lowercase letter',
      };
    }

    if (!/\d/.test(password)) {
      return {
        isValid: false,
        error: 'Password must contain at least one number',
      };
    }

    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
      return {
        isValid: false,
        error: 'Password must contain at least one special character',
      };
    }

    // Check for common patterns
    const commonPatterns = [
      '123456',
      'password',
      'qwerty',
      'abc123',
      'admin123',
      'welcome123',
    ];

    if (
      commonPatterns.some((pattern) => password.toLowerCase().includes(pattern))
    ) {
      return { isValid: false, error: 'Password contains common patterns' };
    }

    // Check for sequential characters
    const sequentialPatterns = ['abcdefghijklmnopqrstuvwxyz', '0123456789'];

    for (const pattern of sequentialPatterns) {
      for (let i = 0; i < pattern.length - 2; i++) {
        const substring = pattern.substring(i, i + 3);
        if (password.toLowerCase().includes(substring)) {
          return {
            isValid: false,
            error: 'Password contains sequential characters',
          };
        }
      }
    }

    return { isValid: true };
  }

  /**
   * Check if password contains username or email
   */
  static checkPasswordContainsUserInfo(
    password: string,
    username?: string,
    email?: string,
  ): boolean {
    const passwordLower = password.toLowerCase();

    if (username && passwordLower.includes(username.toLowerCase())) {
      return true;
    }

    if (email) {
      const emailLocal = email.split('@')[0]?.toLowerCase();
      if (emailLocal && passwordLower.includes(emailLocal)) {
        return true;
      }
    }

    return false;
  }
}
