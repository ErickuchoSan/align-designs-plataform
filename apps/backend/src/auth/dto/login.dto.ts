import { IsString, MinLength, MaxLength } from 'class-validator';
import { ValidateEmail } from '../../common/decorators/email-validation.decorator';
import { PASSWORD_CONSTRAINTS } from '../../common/constants/validation.constants';

export class LoginDto {
  @ValidateEmail()
  email: string;

  @IsString()
  @MinLength(PASSWORD_CONSTRAINTS.MIN_LENGTH, {
    message: `Password must be at least ${PASSWORD_CONSTRAINTS.MIN_LENGTH} characters long`,
  })
  @MaxLength(PASSWORD_CONSTRAINTS.MAX_LENGTH, {
    message: `Password cannot exceed ${PASSWORD_CONSTRAINTS.MAX_LENGTH} characters`,
  })
  password: string;
}
