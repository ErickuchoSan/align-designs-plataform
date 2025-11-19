import { IsEmail, IsString, Length } from 'class-validator';

export class VerifyOtpDto {
  @IsEmail()
  email: string;

  @IsString()
  @Length(8, 8, { message: 'OTP code must have 8 digits' })
  token: string;
}
