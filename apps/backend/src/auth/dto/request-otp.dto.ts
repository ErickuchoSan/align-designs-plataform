import { ValidateEmail } from '../../common/decorators/email-validation.decorator';

export class RequestOtpDto {
  @ValidateEmail()
  email: string;
}
