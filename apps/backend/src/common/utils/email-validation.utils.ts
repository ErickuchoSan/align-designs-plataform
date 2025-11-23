/**
 * Email validation utilities
 * Extracted from validation.utils.ts for better maintainability
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

    const parts = email.split('@');
    if (parts.length !== 2) {
      return false;
    }
    const domain = parts[1].toLowerCase();
    return businessDomains.includes(domain);
  }
}
