import {
  IsNotEmpty,
  IsEmail,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { EmailValidationUtils } from '../utils/validation.utils';
import { EMAIL_CONSTRAINTS } from '../constants/validation.constants';

export class EmailDto {
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsString({ message: 'Email must be a string' })
  @MinLength(EMAIL_CONSTRAINTS.MIN_LENGTH, {
    message: `Email must be at least ${EMAIL_CONSTRAINTS.MIN_LENGTH} characters long`,
  })
  @MaxLength(EMAIL_CONSTRAINTS.MAX_LENGTH, {
    message: `Email cannot exceed ${EMAIL_CONSTRAINTS.MAX_LENGTH} characters`,
  })
  email: string;

  constructor(email: string) {
    this.email = email.toLowerCase().trim();
  }

  /**
   * Validate the email address comprehensively
   */
  validate(): { isValid: boolean; error?: string } {
    return EmailValidationUtils.validateEmail(this.email);
  }

  /**
   * Check if this is a business email
   */
  isBusinessEmail(): boolean {
    return EmailValidationUtils.isBusinessEmail(this.email);
  }

  /**
   * Get the domain part of the email
   */
  getDomain(): string {
    return this.email.split('@')[1] || '';
  }

  /**
   * Get the local part of the email
   */
  getLocalPart(): string {
    return this.email.split('@')[0] || '';
  }

  /**
   * Check if email is from a temporary/disposable provider
   */
  isTemporaryEmail(): boolean {
    const temporaryDomains = [
      'tempmail.com',
      '10minutemail.com',
      'guerrillamail.com',
      'mailinator.com',
      'throwaway.email',
      'tempmail.org',
      'temp-mail.org',
      'mailnesia.com',
      'tempmailo.com',
      'tempmail.net',
      'tempmail.pro',
      'tempmail.de',
    ];

    const domain = this.getDomain().toLowerCase();
    return temporaryDomains.some((tempDomain) => domain.includes(tempDomain));
  }
}
