import {
  IsString,
  IsUUID,
  IsOptional,
  MaxLength,
  MinLength,
  IsArray,
  IsNumber,
  IsPositive,
  IsDateString,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { Sanitize } from '../../common/decorators/sanitize.decorator';
import {
  PROJECT_NAME_CONSTRAINTS,
  PROJECT_DESCRIPTION_CONSTRAINTS,
} from '../../common/constants/validation.constants';

/**
 * DTO for creating a new project
 *
 * Phase 1: Added workflow fields:
 * - employeeIds: Array of employee IDs to assign
 * - initialAmountRequired: Optional initial payment requirement
 * - deadlineDate: Optional project deadline
 */
export class CreateProjectDto {
  @IsString()
  @MinLength(1, { message: 'Project name cannot be empty' })
  @MaxLength(PROJECT_NAME_CONSTRAINTS.MAX_LENGTH, {
    message: `Project name cannot exceed ${PROJECT_NAME_CONSTRAINTS.MAX_LENGTH} characters`,
  })
  @Transform(({ value }) => value?.trim())
  @Sanitize()
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(PROJECT_DESCRIPTION_CONSTRAINTS.MAX_LENGTH, {
    message: `Project description cannot exceed ${PROJECT_DESCRIPTION_CONSTRAINTS.MAX_LENGTH} characters`,
  })
  @Transform(({ value }) => value?.trim())
  @Sanitize()
  description?: string;

  @IsUUID()
  clientId: string;

  // Phase 1: Workflow fields
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true, message: 'Each employee ID must be a valid UUID' })
  employeeIds?: string[];

  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'Initial amount must be a number with maximum 2 decimal places' },
  )
  @IsPositive({ message: 'Initial amount must be positive' })
  @Type(() => Number)
  initialAmountRequired?: number;

  @IsOptional()
  @IsDateString({}, { message: 'Deadline must be a valid ISO 8601 date string' })
  deadlineDate?: string;
}
