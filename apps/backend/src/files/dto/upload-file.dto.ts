import { IsOptional, IsString, MaxLength, IsEnum } from 'class-validator';
import { Sanitize } from '../../common/decorators/sanitize.decorator';
import { Transform } from 'class-transformer';
import { COMMENT_CONSTRAINTS } from '../../common/constants/validation.constants';
import { Stage } from '@prisma/client';
import { ApiPropertyOptional } from '@nestjs/swagger';

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
  @ApiPropertyOptional({ enum: Stage, description: 'Stage where the file belongs' })
  @IsOptional()
  @IsEnum(Stage, {
    message:
      'Stage must be one of: BRIEF_PROJECT, FEEDBACK_CLIENT, FEEDBACK_EMPLOYEE, REFERENCES, SUBMITTED, ADMIN_APPROVED, CLIENT_APPROVED, PAYMENTS',
  })
  @Transform(({ value }) => {
    // If value is a string and matches a Stage enum, return it
    // If value is undefined or null, return undefined
    if (!value) return undefined;
    if (typeof value === 'string' && Object.values(Stage).includes(value as Stage)) {
      return value as Stage;
    }
    return value;
  })
  stage?: Stage;

  @ApiPropertyOptional({ description: 'ID of the file related to this upload (e.g. usage for rejection evidence)' })
  @IsOptional()
  @IsString()
  relatedFileId?: string;
}
