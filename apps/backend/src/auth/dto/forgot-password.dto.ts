import { ValidateEmail } from '../../common/decorators/email-validation.decorator';

export class ForgotPasswordDto {
  @ValidateEmail({ message: 'Invalid email' })
  email: string;
}
