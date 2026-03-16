import {
  parsePhoneNumber,
  isValidPhoneNumber,
  CountryCode,
} from 'libphonenumber-js';
import { COUNTRY_CODES } from '../constants/country-codes.constants';

/**
 * Phone number validation utilities with international support
 * Extracted from validation.utils.ts for better maintainability
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
        const countryDetail = countryCode ? ` for country ${countryCode}` : '';
        return {
          isValid: false,
          formatted: null,
          error: `Invalid phone number${countryDetail}`,
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
    // Sort by length (descending) to match longer codes first
    const sortedCodes = [...COUNTRY_CODES].sort((a, b) => b.length - a.length);

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
