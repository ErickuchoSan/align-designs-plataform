import { User, Prisma } from '@prisma/client';
import { IRepository } from '../../common/interfaces/repository.interface';

/**
 * User Repository Interface
 * Defines all user-related database operations
 * Services depend on this interface, not on Prisma implementation
 */
export interface IUserRepository
  extends IRepository<User, Prisma.UserCreateInput, Prisma.UserUpdateInput> {
  /**
   * Find user by email
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Find user by ID with password (for authentication)
   */
  findByIdWithPassword(id: string): Promise<User | null>;

  /**
   * Update user password
   */
  updatePassword(userId: string, hashedPassword: string): Promise<void>;

  /**
   * Verify if email exists
   */
  emailExists(email: string): Promise<boolean>;

  /**
   * Find users by role
   */
  findByRole(role: string): Promise<User[]>;

  /**
   * Find active users only
   */
  findActiveUsers(): Promise<User[]>;

  /**
   * Update last login timestamp
   */
  updateLastLogin(userId: string): Promise<void>;

  /**
   * Soft delete user (set isActive to false)
   */
  softDelete(userId: string): Promise<User>;
}
