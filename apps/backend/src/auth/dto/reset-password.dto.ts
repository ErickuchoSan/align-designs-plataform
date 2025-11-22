import {
  ValidatePassword,
  ValidatePasswordConfirmation,
} from '../../common/decorators/password-validation.decorator';
import { ValidateOtp } from '../../common/decorators/otp-validation.decorator';
import { ValidateEmail } from '../../common/decorators/email-validation.decorator';

export class ResetPasswordDto {
  @ValidateEmail({ message: 'Email must be valid' })
  email: string;

  @ValidateOtp()
  otp: string;

  @ValidatePassword({ fieldName: 'New password' })
  newPassword: string;

  @ValidatePasswordConfirmation({ fieldName: 'Password confirmation' })
  confirmPassword: string;
}
