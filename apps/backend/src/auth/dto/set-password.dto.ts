import { IsNotEmpty } from 'class-validator';
import {
  ValidatePassword,
  ValidatePasswordConfirmation,
} from '../../common/decorators/password-validation.decorator';

export class SetPasswordDto {
  @IsNotEmpty({ message: 'Password is required' })
  @ValidatePassword()
  password: string;

  @IsNotEmpty({ message: 'Password confirmation is required' })
  @ValidatePasswordConfirmation()
  confirmPassword: string;
}
