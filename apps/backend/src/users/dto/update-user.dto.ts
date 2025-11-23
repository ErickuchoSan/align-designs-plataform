import {
  IsString,
  IsOptional,
  IsBoolean,
  MaxLength,
  MinLength,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { Sanitize } from '../../common/decorators/sanitize.decorator';
import { NAME_CONSTRAINTS } from '../../common/constants/validation.constants';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'First name cannot be empty' })
  @MaxLength(NAME_CONSTRAINTS.MAX_LENGTH, {
    message: `First name cannot exceed ${NAME_CONSTRAINTS.MAX_LENGTH} characters`,
  })
  @Matches(/^[a-zA-ZÀ-ÿ\s'-]+$/, {
    message:
      'First name can only contain letters, spaces, hyphens, and apostrophes',
  })
  @Transform(({ value }) => value?.trim())
  @Sanitize()
  firstName?: string;

  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Last name cannot be empty' })
  @MaxLength(NAME_CONSTRAINTS.MAX_LENGTH, {
    message: `Last name cannot exceed ${NAME_CONSTRAINTS.MAX_LENGTH} characters`,
  })
  @Matches(/^[a-zA-ZÀ-ÿ\s'-]+$/, {
    message:
      'Last name can only contain letters, spaces, hyphens, and apostrophes',
  })
  @Transform(({ value }) => value?.trim())
  @Sanitize()
  lastName?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: 'Phone must be a valid international phone number',
  })
  @Transform(({ value }) => value?.trim())
  phone?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
