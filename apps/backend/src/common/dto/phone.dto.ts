import { IsNotEmpty, IsString, Matches, Length } from 'class-validator';
import { PhoneValidationUtils } from '../utils/validation.utils';

export class PhoneDto {
  @IsNotEmpty({ message: 'Country code is required' })
  @IsString({ message: 'Country code must be a string' })
  @Matches(/^\+\d{1,3}$/, {
    message: 'Country code must start with + and contain 1-3 digits',
  })
  countryCode: string;

  @IsNotEmpty({ message: 'Phone number is required' })
  @IsString({ message: 'Phone number must be a string' })
  @Matches(/^\d{10}$/, {
    message: 'Phone number must contain exactly 10 digits',
  })
  @Length(10, 10, { message: 'Phone number must be exactly 10 digits long' })
  phoneNumber: string;

  constructor(countryCode: string, phoneNumber: string) {
    this.countryCode = countryCode;
    this.phoneNumber = phoneNumber;
  }

  /**
   * Get full phone number in E.164 format
   */
  getFullPhoneNumber(): string {
    return `${this.countryCode}${this.phoneNumber}`;
  }

  /**
   * Validate the complete phone number
   */
  validate(): boolean {
    return PhoneValidationUtils.validatePhoneNumber(this.phoneNumber);
  }

  /**
   * Format phone number for display
   */
  formatForDisplay(): string {
    // Format as (XXX) XXX-XXXX for US/Canada numbers
    if (this.countryCode === '+1') {
      return `(${this.phoneNumber.slice(0, 3)}) ${this.phoneNumber.slice(3, 6)}-${this.phoneNumber.slice(6)}`;
    }

    // Default format for other countries
    return `${this.countryCode} ${this.phoneNumber}`;
  }
}
