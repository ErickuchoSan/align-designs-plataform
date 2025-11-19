import {
  PhoneValidationUtils,
  EmailValidationUtils,
  PasswordValidationUtils,
} from './validation.utils';

describe('PhoneValidationUtils', () => {
  describe('validatePhoneNumber', () => {
    it('should validate correct 10-digit phone numbers', () => {
      expect(PhoneValidationUtils.validatePhoneNumber('1234567890')).toBe(true);
      expect(PhoneValidationUtils.validatePhoneNumber('5551234567')).toBe(true);
      expect(PhoneValidationUtils.validatePhoneNumber('9876543210')).toBe(true);
    });

    it('should reject phone numbers with incorrect length', () => {
      expect(PhoneValidationUtils.validatePhoneNumber('123456789')).toBe(false); // 9 digits
      expect(PhoneValidationUtils.validatePhoneNumber('12345678901')).toBe(
        false,
      ); // 11 digits
      expect(PhoneValidationUtils.validatePhoneNumber('123')).toBe(false); // 3 digits
    });

    it('should reject phone numbers with non-digit characters', () => {
      expect(PhoneValidationUtils.validatePhoneNumber('123-456-7890')).toBe(
        false,
      );
      expect(PhoneValidationUtils.validatePhoneNumber('(123) 456-7890')).toBe(
        false,
      );
      expect(PhoneValidationUtils.validatePhoneNumber('123.456.7890')).toBe(
        false,
      );
      expect(PhoneValidationUtils.validatePhoneNumber('123abc7890')).toBe(
        false,
      );
    });

    it('should reject empty or invalid inputs', () => {
      expect(PhoneValidationUtils.validatePhoneNumber('')).toBe(false);
      expect(PhoneValidationUtils.validatePhoneNumber('   ')).toBe(false);
      expect(PhoneValidationUtils.validatePhoneNumber('abcdefghij')).toBe(
        false,
      );
    });
  });

  describe('formatToE164', () => {
    it('should format phone numbers to E.164 format', () => {
      expect(PhoneValidationUtils.formatToE164('1234567890', '+1')).toBe(
        '+11234567890',
      );
      expect(PhoneValidationUtils.formatToE164('5551234567', '+52')).toBe(
        '+525551234567',
      );
      expect(PhoneValidationUtils.formatToE164('9876543210', '+44')).toBe(
        '+449876543210',
      );
    });

    it('should handle phone numbers with formatting characters', () => {
      expect(PhoneValidationUtils.formatToE164('(123) 456-7890', '+1')).toBe(
        '+11234567890',
      );
      expect(PhoneValidationUtils.formatToE164('123.456.7890', '+52')).toBe(
        '+521234567890',
      );
      expect(PhoneValidationUtils.formatToE164('123 456 7890', '+44')).toBe(
        '+441234567890',
      );
    });
  });

  describe('extractCountryCodeAndNumber', () => {
    it('should extract country code and phone number', () => {
      const result1 =
        PhoneValidationUtils.extractCountryCodeAndNumber('+11234567890');
      expect(result1.countryCode).toBe('+1');
      expect(result1.phoneNumber).toBe('1234567890');

      const result2 =
        PhoneValidationUtils.extractCountryCodeAndNumber('+525551234567');
      expect(result2.countryCode).toBe('+52');
      expect(result2.phoneNumber).toBe('5551234567');

      const result3 =
        PhoneValidationUtils.extractCountryCodeAndNumber('+449876543210');
      expect(result3.countryCode).toBe('+44');
      expect(result3.phoneNumber).toBe('9876543210');
    });

    it('should handle phone numbers without country code', () => {
      const result =
        PhoneValidationUtils.extractCountryCodeAndNumber('1234567890');
      expect(result.countryCode).toBe('+1');
      expect(result.phoneNumber).toBe('1234567890');
    });

    it('should handle phone numbers with spaces', () => {
      const result =
        PhoneValidationUtils.extractCountryCodeAndNumber('+1 123 456 7890');
      expect(result.countryCode).toBe('+1');
      expect(result.phoneNumber).toBe('1234567890');
    });
  });
});

describe('EmailValidationUtils', () => {
  describe('validateEmail', () => {
    it('should validate correct email formats', () => {
      expect(
        EmailValidationUtils.validateEmail('user@example.com').isValid,
      ).toBe(true);
      expect(
        EmailValidationUtils.validateEmail('john.doe@company.org').isValid,
      ).toBe(true);
      expect(
        EmailValidationUtils.validateEmail('test.user123@domain.co.uk').isValid,
      ).toBe(true);
      expect(EmailValidationUtils.validateEmail('a@b.co').isValid).toBe(true);
    });

    it('should reject invalid email formats', () => {
      expect(EmailValidationUtils.validateEmail('invalid-email').isValid).toBe(
        false,
      );
      expect(EmailValidationUtils.validateEmail('user@').isValid).toBe(false);
      expect(EmailValidationUtils.validateEmail('@domain.com').isValid).toBe(
        false,
      );
      expect(EmailValidationUtils.validateEmail('user@domain').isValid).toBe(
        false,
      );
      expect(EmailValidationUtils.validateEmail('').isValid).toBe(false);
    });

    it('should reject emails with invalid characters in local part', () => {
      const result = EmailValidationUtils.validateEmail(
        'user space@domain.com',
      );
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid characters');
    });

    it('should reject emails that start or end with dots', () => {
      expect(
        EmailValidationUtils.validateEmail('.user@domain.com').isValid,
      ).toBe(false);
      expect(
        EmailValidationUtils.validateEmail('user.@domain.com').isValid,
      ).toBe(false);
    });

    it('should reject emails with consecutive dots', () => {
      expect(
        EmailValidationUtils.validateEmail('user..name@domain.com').isValid,
      ).toBe(false);
    });

    it('should reject emails with suspicious domains', () => {
      const result = EmailValidationUtils.validateEmail('user@tempmail.com');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Temporary email');
    });

    it('should reject emails that are too long', () => {
      const longLocal = 'a'.repeat(65);
      const result = EmailValidationUtils.validateEmail(
        `${longLocal}@domain.com`,
      );
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('too long');
    });
  });

  describe('isBusinessEmail', () => {
    it('should identify business emails correctly', () => {
      expect(EmailValidationUtils.isBusinessEmail('user@microsoft.com')).toBe(
        true,
      );
      expect(EmailValidationUtils.isBusinessEmail('user@google.com')).toBe(
        true,
      );
      expect(EmailValidationUtils.isBusinessEmail('user@linkedin.com')).toBe(
        true,
      );
    });

    it('should not identify personal emails as business', () => {
      expect(EmailValidationUtils.isBusinessEmail('user@gmail.com')).toBe(
        false,
      );
      expect(EmailValidationUtils.isBusinessEmail('user@yahoo.com')).toBe(
        false,
      );
      expect(EmailValidationUtils.isBusinessEmail('user@hotmail.com')).toBe(
        false,
      );
    });
  });
});

describe('PasswordValidationUtils', () => {
  describe('validatePassword', () => {
    it('should validate strong passwords', () => {
      expect(
        PasswordValidationUtils.validatePassword('MyP@ssw0rd123!').isValid,
      ).toBe(true);
      expect(
        PasswordValidationUtils.validatePassword('C0mpl3x!P@ss').isValid,
      ).toBe(true);
      expect(
        PasswordValidationUtils.validatePassword('Str0ng#P@ssw0rd').isValid,
      ).toBe(true);
    });

    it('should reject passwords that are too short', () => {
      const result = PasswordValidationUtils.validatePassword('Short1!');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('12 characters');
    });

    it('should reject passwords without uppercase letters', () => {
      const result = PasswordValidationUtils.validatePassword('mypassword123!');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('uppercase');
    });

    it('should reject passwords without lowercase letters', () => {
      const result = PasswordValidationUtils.validatePassword('MYPASSWORD123!');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('lowercase');
    });

    it('should reject passwords without numbers', () => {
      const result = PasswordValidationUtils.validatePassword('MyPassword!@#');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('number');
    });

    it('should reject passwords without special characters', () => {
      const result = PasswordValidationUtils.validatePassword('MyPassword123');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('special character');
    });

    it('should reject passwords with common patterns', () => {
      const result =
        PasswordValidationUtils.validatePassword('MyPassword123456!');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('common patterns');
    });

    it('should reject passwords with sequential characters', () => {
      const result =
        PasswordValidationUtils.validatePassword('MyPasswordabc123!');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('sequential');
    });
  });

  describe('calculatePasswordStrength', () => {
    it('should calculate strength correctly', () => {
      const veryWeak = PasswordValidationUtils.calculatePasswordStrength('abc');
      expect(veryWeak.score).toBeLessThanOrEqual(1);
      expect(veryWeak.label).toBe('Very Weak');

      const weak = PasswordValidationUtils.calculatePasswordStrength('Abc123');
      expect(weak.score).toBe(2);
      expect(weak.label).toBe('Weak');

      const fair = PasswordValidationUtils.calculatePasswordStrength('Abc123!');
      expect(fair.score).toBe(3);
      expect(fair.label).toBe('Fair');

      const good =
        PasswordValidationUtils.calculatePasswordStrength('Abc123!@');
      expect(good.score).toBe(4);
      expect(good.label).toBe('Good');

      const strong =
        PasswordValidationUtils.calculatePasswordStrength('MyP@ssw0rd123!');
      expect(strong.score).toBe(5);
      expect(strong.label).toBe('Strong');
    });
  });

  describe('checkPasswordContainsUserInfo', () => {
    it('should detect when password contains username', () => {
      expect(
        PasswordValidationUtils.checkPasswordContainsUserInfo(
          'johnpassword123!',
          'john',
        ),
      ).toBe(true);
      expect(
        PasswordValidationUtils.checkPasswordContainsUserInfo(
          'MyJohnPass123!',
          'john',
        ),
      ).toBe(true);
    });

    it('should detect when password contains email local part', () => {
      expect(
        PasswordValidationUtils.checkPasswordContainsUserInfo(
          'johndoe123!',
          undefined,
          'john.doe@example.com',
        ),
      ).toBe(true);
      expect(
        PasswordValidationUtils.checkPasswordContainsUserInfo(
          'MyJohnDoePass123!',
          undefined,
          'john.doe@example.com',
        ),
      ).toBe(true);
    });

    it('should not detect false positives', () => {
      expect(
        PasswordValidationUtils.checkPasswordContainsUserInfo(
          'MyComplexPass123!',
          'jane',
        ),
      ).toBe(false);
      expect(
        PasswordValidationUtils.checkPasswordContainsUserInfo(
          'MyComplexPass123!',
          undefined,
          'jane.doe@example.com',
        ),
      ).toBe(false);
    });
  });
});
