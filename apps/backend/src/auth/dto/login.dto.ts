import { IsString, MinLength, MaxLength } from 'class-validator';
import { ValidateEmail } from '../../common/decorators/email-validation.decorator';

export class LoginDto {
  @ValidateEmail()
  email: string;

  @IsString()
  @MinLength(12, { message: 'Password must be at least 12 characters long' })
  @MaxLength(128, { message: 'Password cannot exceed 128 characters' })
  password: string;
}
