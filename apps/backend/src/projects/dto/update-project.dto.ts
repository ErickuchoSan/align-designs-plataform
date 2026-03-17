import { PartialType } from '@nestjs/swagger';
import { CreateProjectDto } from './create-project.dto';

/**
 * DTO for updating a project
 * Extends CreateProjectDto with all fields made optional via PartialType
 */
export class UpdateProjectDto extends PartialType(CreateProjectDto) {}
