import { IsUUID } from 'class-validator';

/**
 * DTO for approving a file
 *
 * Admin can:
 * - Approve SUBMITTED files → ADMIN_APPROVED
 * - Mark ADMIN_APPROVED files as client-approved → CLIENT_APPROVED (triggers payment)
 */
export class ApproveFileDto {
  @IsUUID('4', { message: 'File ID must be a valid UUID' })
  fileId: string;
}
