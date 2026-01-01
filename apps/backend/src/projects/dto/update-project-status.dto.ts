import { IsEnum } from 'class-validator';
import { ProjectStatus } from '@prisma/client';

/**
 * DTO for updating project status
 *
 * Status Flow:
 * WAITING_PAYMENT → ACTIVE → COMPLETED → ARCHIVED
 */
export class UpdateProjectStatusDto {
  @IsEnum(ProjectStatus, {
    message:
      'Status must be one of: WAITING_PAYMENT, ACTIVE, COMPLETED, ARCHIVED',
  })
  status: ProjectStatus;
}
