import { IsNotEmpty, IsString, Matches, Length } from 'class-validator';
import { PhoneValidationUtils } from '../utils/validation.utils';
import { PHONE_CONSTRAINTS } from '../constants/validation.constants';

export class PhoneDto {
  @IsNotEmpty({ message: 'Country code is required' })
  @IsString({ message: 'Country code must be a string' })
  @Matches(
    new RegExp(
      String.raw`^\+\d{${PHONE_CONSTRAINTS.COUNTRY_CODE_MIN_LENGTH},${PHONE_CONSTRAINTS.COUNTRY_CODE_MAX_LENGTH}}$`,
    ),
    {
      message: `Country code must start with + and contain ${PHONE_CONSTRAINTS.COUNTRY_CODE_MIN_LENGTH}-${PHONE_CONSTRAINTS.COUNTRY_CODE_MAX_LENGTH} digits`,
    },
  )
  countryCode: string;

  @IsNotEmpty({ message: 'Phone number is required' })
  @IsString({ message: 'Phone number must be a string' })
  @Matches(new RegExp(String.raw`^\d{${PHONE_CONSTRAINTS.NUMBER_LENGTH}}$`), {
    message: `Phone number must contain exactly ${PHONE_CONSTRAINTS.NUMBER_LENGTH} digits`,
  })
  @Length(PHONE_CONSTRAINTS.NUMBER_LENGTH, PHONE_CONSTRAINTS.NUMBER_LENGTH, {
    message: `Phone number must be exactly ${PHONE_CONSTRAINTS.NUMBER_LENGTH} digits long`,
  })
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
