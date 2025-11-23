import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

/**
 * File filters DTO - Extends pagination with file-specific filters
 * Moved from frontend to backend for better performance
 */
export class FileFiltersDto extends PaginationDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  type?: string;
}
