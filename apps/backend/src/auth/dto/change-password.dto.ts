import {
  ValidatePassword,
  ValidatePasswordConfirmation,
} from '../../common/decorators/password-validation.decorator';

export class ChangePasswordDto {
  @ValidatePassword({ fieldName: 'Current password' })
  currentPassword: string;

  @ValidatePassword({ fieldName: 'New password' })
  newPassword: string;

  @ValidatePasswordConfirmation({ fieldName: 'Password confirmation' })
  confirmPassword: string;
}
