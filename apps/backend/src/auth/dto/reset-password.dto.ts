import { IsEmail } from 'class-validator';
import { Transform } from 'class-transformer';
import {
  ValidatePassword,
  ValidatePasswordConfirmation,
} from '../../common/decorators/password-validation.decorator';
import { ValidateOtp } from '../../common/decorators/otp-validation.decorator';

export class ResetPasswordDto {
  @IsEmail({}, { message: 'Email must be valid' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @ValidateOtp()
  otp: string;

  @ValidatePassword({ fieldName: 'New password' })
  newPassword: string;

  @ValidatePasswordConfirmation({ fieldName: 'Password confirmation' })
  confirmPassword: string;
}
