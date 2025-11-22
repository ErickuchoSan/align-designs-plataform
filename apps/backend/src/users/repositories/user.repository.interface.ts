import { User, Role } from '@prisma/client';
import { IBaseRepository, FindAllOptions } from '../../common/repositories/base.repository';
import { CreateClientDto } from '../dto/create-client.dto';
import { UpdateUserDto } from '../dto/update-user.dto';

/**
 * User repository interface
 * Abstracts data access for User entities
 */
export interface IUserRepository
  extends IBaseRepository<User, CreateClientDto, UpdateUserDto> {
  /**
   * Find user by email
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Find users by role
   */
  findByRole(role: Role, options?: FindAllOptions): Promise<User[]>;

  /**
   * Find all users with pagination
   */
  findAllWithPagination(options: FindAllOptions): Promise<{
    data: User[];
    total: number;
  }>;

  /**
   * Check if email exists
   */
  emailExists(email: string): Promise<boolean>;

  /**
   * Update user password
   */
  updatePassword(userId: string, hashedPassword: string): Promise<User>;

  /**
   * Toggle user active status
   */
  toggleStatus(userId: string): Promise<User>;
}
