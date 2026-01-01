import { IsArray, IsUUID, ArrayMinSize } from 'class-validator';

/**
 * DTO for assigning employees to a project
 *
 * Business Rule: Each employee can only be assigned to ONE active project at a time
 */
export class AssignEmployeesDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one employee must be assigned' })
  @IsUUID('4', { each: true, message: 'Each employee ID must be a valid UUID' })
  employeeIds: string[];
}
