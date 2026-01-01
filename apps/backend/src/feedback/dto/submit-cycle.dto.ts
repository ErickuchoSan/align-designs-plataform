import { IsUUID } from 'class-validator';

/**
 * DTO for submitting a feedback cycle
 *
 * Employee submits their deliverable file, marking the cycle as 'submitted'
 * Admin can then approve or reject the submission
 */
export class SubmitCycleDto {
  @IsUUID('4', { message: 'Cycle ID must be a valid UUID' })
  cycleId: string;

  @IsUUID('4', { message: 'Submitted file ID must be a valid UUID' })
  submittedFileId: string;
}
