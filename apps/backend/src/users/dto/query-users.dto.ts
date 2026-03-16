import { IsOptional, IsEnum } from 'class-validator';
import { Role } from '@prisma/client';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class QueryUsersDto extends PaginationDto {
  @IsOptional()
  @IsEnum(Role, {
    message: 'Role must be a valid role (ADMIN, CLIENT, or EMPLOYEE)',
  })
  role?: Role;
}
