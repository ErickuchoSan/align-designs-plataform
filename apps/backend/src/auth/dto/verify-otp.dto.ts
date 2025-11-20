import { IsEmail, IsString, Length, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

export class VerifyOtpDto {
  @IsEmail({}, { message: 'Invalid email address' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @IsString()
  @Length(8, 8, { message: 'OTP code must have 8 digits' })
  @Matches(/^\d{8}$/, { message: 'OTP code must contain only digits' })
  @Transform(({ value }) => value?.trim())
  token: string;
}
