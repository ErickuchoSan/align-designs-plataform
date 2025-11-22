import { IsEmail } from 'class-validator';
import { Transform } from 'class-transformer';
import { ValidateOtp } from '../../common/decorators/otp-validation.decorator';

export class VerifyOtpDto {
  @IsEmail({}, { message: 'Invalid email address' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @ValidateOtp()
  token: string;
}
