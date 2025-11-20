import { UserEntity } from '../entities/user.entity';

/**
 * User Repository Interface
 * Defines contract for user persistence
 * Separates domain logic from infrastructure (database)
 */
export interface IUserRepository {
  /**
   * Find user by ID
   */
  findById(id: string): Promise<UserEntity | null>;

  /**
   * Find user by email
   */
  findByEmail(email: string): Promise<UserEntity | null>;

  /**
   * Find all users
   */
  findAll(params: {
    page: number;
    limit: number;
    role?: string;
    isActive?: boolean;
  }): Promise<{
    users: UserEntity[];
    total: number;
  }>;

  /**
   * Save user (create or update)
   */
  save(user: UserEntity): Promise<UserEntity>;

  /**
   * Delete user
   */
  delete(id: string): Promise<void>;

  /**
   * Check if email exists
   */
  existsByEmail(email: string): Promise<boolean>;
}
