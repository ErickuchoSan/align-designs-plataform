import {
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { PasswordValidationUtils } from '../utils/validation.utils';
import { PasswordValidation } from '../interfaces/password-strength.interface';

export class PasswordDto {
  @IsNotEmpty({ message: 'Password is required' })
  @IsString({ message: 'Password must be a string' })
  @MinLength(12, { message: 'Password must be at least 12 characters long' })
  @MaxLength(128, { message: 'Password cannot exceed 128 characters' })
  @Matches(/[A-Z]/, {
    message: 'Password must contain at least one uppercase letter',
  })
  @Matches(/[a-z]/, {
    message: 'Password must contain at least one lowercase letter',
  })
  @Matches(/\d/, { message: 'Password must contain at least one number' })
  @Matches(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/, {
    message: 'Password must contain at least one special character',
  })
  password: string;

  constructor(password: string) {
    this.password = password;
  }

  /**
   * Validate password strength and requirements
   */
  validate(): PasswordValidation {
    const basicValidation = PasswordValidationUtils.validatePassword(
      this.password,
    );
    if (!basicValidation.isValid) {
      return basicValidation;
    }

    const strength = PasswordValidationUtils.calculatePasswordStrength(
      this.password,
    );

    // Additional security checks
    if (strength.score < 3) {
      return {
        isValid: false,
        error:
          'Password is too weak. Please use a stronger combination of characters.',
      };
    }

    return {
      isValid: true,
      strength,
    };
  }

  /**
   * Check if password contains user information
   */
  containsUserInfo(username?: string, email?: string): boolean {
    return PasswordValidationUtils.checkPasswordContainsUserInfo(
      this.password,
      username,
      email,
    );
  }

  /**
   * Get password strength information
   */
  getStrength() {
    return PasswordValidationUtils.calculatePasswordStrength(this.password);
  }
}
