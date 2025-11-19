import { IsString, IsOptional, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { Sanitize } from '../../common/decorators/sanitize.decorator';

export class UpdateProjectDto {
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Project name cannot be empty' })
  @MaxLength(255, { message: 'Project name cannot exceed 255 characters' })
  @Transform(({ value }) => value?.trim())
  @Sanitize()
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000, {
    message: 'Project description cannot exceed 5000 characters',
  })
  @Transform(({ value }) => value?.trim())
  @Sanitize()
  description?: string;
}
