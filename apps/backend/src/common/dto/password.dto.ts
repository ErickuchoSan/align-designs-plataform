import { IsNotEmpty } from 'class-validator';
import { PasswordValidationUtils } from '../utils/validation.utils';
import { PasswordValidation } from '../interfaces/password-strength.interface';
import { ValidatePassword } from '../decorators/password-validation.decorator';

export class PasswordDto {
  @IsNotEmpty({ message: 'Password is required' })
  @ValidatePassword()
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
