import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  Matches,
  IsNotEmpty,
  IsEnum,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { Sanitize } from '../../common/decorators/sanitize.decorator';
import { ValidateEmail } from '../../common/decorators/email-validation.decorator';
import { NAME_CONSTRAINTS } from '../../common/constants/validation.constants';
import { Role } from '@prisma/client';

export class CreateUserDto {
  @ValidateEmail()
  email: string;

  @IsString({ message: 'First name must be a string' })
  @IsNotEmpty({ message: 'First name is required' })
  @MinLength(NAME_CONSTRAINTS.MIN_LENGTH, {
    message: 'First name cannot be empty',
  })
  @MaxLength(NAME_CONSTRAINTS.MAX_LENGTH, {
    message: `First name cannot exceed ${NAME_CONSTRAINTS.MAX_LENGTH} characters`,
  })
  @Matches(/^[a-zA-ZÀ-ÿ\s'-]+$/, {
    message:
      'First name can only contain letters, spaces, hyphens, and apostrophes',
  })
  @Sanitize()
  @Transform(({ value }) => value?.trim())
  firstName: string;

  @IsString({ message: 'Last name must be a string' })
  @IsNotEmpty({ message: 'Last name is required' })
  @MinLength(NAME_CONSTRAINTS.MIN_LENGTH, {
    message: 'Last name cannot be empty',
  })
  @MaxLength(NAME_CONSTRAINTS.MAX_LENGTH, {
    message: `Last name cannot exceed ${NAME_CONSTRAINTS.MAX_LENGTH} characters`,
  })
  @Matches(/^[a-zA-ZÀ-ÿ\s'-]+$/, {
    message:
      'Last name can only contain letters, spaces, hyphens, and apostrophes',
  })
  @Sanitize()
  @Transform(({ value }) => value?.trim())
  lastName: string;

  @IsOptional()
  @IsString({ message: 'Phone must be a string' })
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message:
      'Invalid phone format. Use international format (e.g., +1234567890)',
  })
  @Transform(({ value }) => value?.trim())
  phone?: string;

  @IsEnum(Role, { message: 'Role must be either CLIENT or EMPLOYEE' })
  @Transform(({ value }) => value || 'CLIENT')
  role: 'CLIENT' | 'EMPLOYEE';
}
