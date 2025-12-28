import { IsOptional, IsString, MaxLength, IsEnum } from 'class-validator';
import { Sanitize } from '../../common/decorators/sanitize.decorator';
import { Transform } from 'class-transformer';
import { COMMENT_CONSTRAINTS } from '../../common/constants/validation.constants';
import { Stage } from '@prisma/client';

/**
 * DTO for uploading a file to a project
 *
 * Phase 1: Added stage field for workflow management
 * Stage determines who can upload and view the file
 */
export class UploadFileDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  @MaxLength(COMMENT_CONSTRAINTS.MAX_LENGTH, {
    message: `Comment cannot exceed ${COMMENT_CONSTRAINTS.MAX_LENGTH} characters`,
  })
  @Sanitize()
  comment?: string;

  // Phase 1: Workflow stage
  @IsOptional()
  @IsEnum(Stage, {
    message:
      'Stage must be one of: BRIEF_PROJECT, FEEDBACK_CLIENT, FEEDBACK_EMPLOYEE, REFERENCES, SUBMITTED, ADMIN_APPROVED, CLIENT_APPROVED, PAYMENTS',
  })
  stage?: Stage;
}
