import { IsUUID } from 'class-validator';

/**
 * DTO for cycle actions (approve/reject)
 *
 * Used for:
 * - Approving a submitted cycle (status → approved)
 * - Rejecting a submitted cycle (status → open, employee can resubmit)
 */
export class CycleActionDto {
  @IsUUID('4', { message: 'Cycle ID must be a valid UUID' })
  cycleId: string;
}
