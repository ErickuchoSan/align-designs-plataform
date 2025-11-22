import { ValidateEmail } from '../../common/decorators/email-validation.decorator';

export class CheckEmailDto {
  @ValidateEmail()
  email: string;
}
