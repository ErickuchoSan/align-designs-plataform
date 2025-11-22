import { ValidateEmail } from '../../common/decorators/email-validation.decorator';
import { ValidateOtp } from '../../common/decorators/otp-validation.decorator';

export class VerifyOtpDto {
  @ValidateEmail()
  email: string;

  @ValidateOtp()
  token: string;
}
