import { IsEmail, IsString, Length, Matches } from 'class-validator';
import { Transform } from 'class-transformer';
import {
  ValidatePassword,
  ValidatePasswordConfirmation,
} from '../../common/decorators/password-validation.decorator';

export class ResetPasswordDto {
  @IsEmail({}, { message: 'Email must be valid' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @IsString()
  @Length(8, 8, { message: 'OTP code must have 8 digits' })
  @Matches(/^\d{8}$/, { message: 'OTP code must contain only digits' })
  @Transform(({ value }) => value?.trim())
  otp: string;

  @ValidatePassword({ fieldName: 'New password' })
  newPassword: string;

  @ValidatePasswordConfirmation({ fieldName: 'Password confirmation' })
  confirmPassword: string;
}
