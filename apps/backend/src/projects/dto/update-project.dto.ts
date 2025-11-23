import { IsString, IsOptional, MaxLength, MinLength, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';
import { Sanitize } from '../../common/decorators/sanitize.decorator';
import {
  PROJECT_NAME_CONSTRAINTS,
  PROJECT_DESCRIPTION_CONSTRAINTS,
} from '../../common/constants/validation.constants';

export class UpdateProjectDto {
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Project name cannot be empty' })
  @MaxLength(PROJECT_NAME_CONSTRAINTS.MAX_LENGTH, {
    message: `Project name cannot exceed ${PROJECT_NAME_CONSTRAINTS.MAX_LENGTH} characters`,
  })
  @Transform(({ value }) => value?.trim())
  @Sanitize()
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(PROJECT_DESCRIPTION_CONSTRAINTS.MAX_LENGTH, {
    message: `Project description cannot exceed ${PROJECT_DESCRIPTION_CONSTRAINTS.MAX_LENGTH} characters`,
  })
  @Transform(({ value }) => value?.trim())
  @Sanitize()
  description?: string;

  @IsOptional()
  @IsUUID('4', { message: 'Invalid client ID format' })
  clientId?: string;
}
