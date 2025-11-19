import { IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @MaxLength(128)
  currentPassword: string;

  @IsString()
  @MinLength(12, {
    message: 'New password must be at least 12 characters long',
  })
  @MaxLength(128, { message: 'Password cannot exceed 128 characters' })
  @Matches(/[A-Z]/, {
    message: 'Password must contain at least one uppercase letter',
  })
  @Matches(/[a-z]/, {
    message: 'Password must contain at least one lowercase letter',
  })
  @Matches(/\d/, { message: 'Password must contain at least one number' })
  @Matches(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/, {
    message: 'Password must contain at least one special character',
  })
  newPassword: string;

  @IsString()
  @MinLength(12, {
    message: 'Confirmation must be at least 12 characters long',
  })
  @MaxLength(128)
  confirmPassword: string;
}
