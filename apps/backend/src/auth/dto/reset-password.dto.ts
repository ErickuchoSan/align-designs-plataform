import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  Length,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class ResetPasswordDto {
  @IsEmail({}, { message: 'Email must be valid' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @IsString()
  @Length(8, 8, { message: 'OTP code must have 8 digits' })
  @Matches(/^\d{8}$/, { message: 'OTP code must contain only digits' })
  @Transform(({ value }) => value?.trim())
  otp: string;

  @IsString()
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
  newPassword: string;

  @IsString()
  @MinLength(12, {
    message: 'Password confirmation must be at least 12 characters long',
  })
  @MaxLength(128)
  confirmPassword: string;
}
