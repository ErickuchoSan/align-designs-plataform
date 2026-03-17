import { IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
import { Role } from '@prisma/client';
import { BasePersonDto } from './base-person.dto';

/**
 * DTO for creating a new user
 * Extends BasePersonDto and adds role field
 */
export class CreateUserDto extends BasePersonDto {
  @IsEnum(Role, { message: 'Role must be either CLIENT or EMPLOYEE' })
  @Transform(({ value }) => value || 'CLIENT')
  role: 'CLIENT' | 'EMPLOYEE';
}
