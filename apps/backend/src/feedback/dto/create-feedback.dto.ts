import {
  IsUUID,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * DTO for creating feedback in a cycle
 *
 * Feedback can be:
 * - Text content (content field)
 * - File attachment (fileDocumentId field)
 * - Both text and file
 *
 * At least one of content or fileDocumentId must be provided
 */
export class CreateFeedbackDto {
  @IsUUID('4', { message: 'Project ID must be a valid UUID' })
  projectId: string;

  @IsUUID('4', { message: 'Employee ID must be a valid UUID' })
  employeeId: string;

  @IsEnum(['client_space', 'employee_space'], {
    message: 'Target audience must be either client_space or employee_space',
  })
  targetAudience: 'client_space' | 'employee_space';

  @IsOptional()
  @IsString()
  @MaxLength(5000, {
    message: 'Feedback content cannot exceed 5000 characters',
  })
  @Transform(({ value }) => value?.trim())
  content?: string;

  @IsOptional()
  @IsUUID('4', { message: 'File document ID must be a valid UUID' })
  fileDocumentId?: string;

  // At least one of content or fileDocumentId must be provided
  @ValidateIf((o) => !o.content && !o.fileDocumentId)
  @IsString({ message: 'Either content or fileDocumentId must be provided' })
  _atLeastOne?: string;
}
