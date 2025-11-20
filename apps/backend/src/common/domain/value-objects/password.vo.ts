import { BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

/**
 * Password Value Object
 * Represents a validated, hashed password
 * Encapsulates password validation and hashing logic
 */
export class Password {
  private readonly hash: string;

  private constructor(hash: string) {
    this.hash = hash;
  }

  /**
   * Create Password from plain text (validates and hashes)
   */
  static async createFromPlain(plainPassword: string): Promise<Password> {
    // Validate password strength
    if (plainPassword.length < 12) {
      throw new BadRequestException(
        'Password must be at least 12 characters long',
      );
    }

    if (!/[A-Z]/.test(plainPassword)) {
      throw new BadRequestException(
        'Password must contain at least one uppercase letter',
      );
    }

    if (!/[a-z]/.test(plainPassword)) {
      throw new BadRequestException(
        'Password must contain at least one lowercase letter',
      );
    }

    if (!/\d/.test(plainPassword)) {
      throw new BadRequestException(
        'Password must contain at least one number',
      );
    }

    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(plainPassword)) {
      throw new BadRequestException(
        'Password must contain at least one special character',
      );
    }

    // Hash password
    const saltRounds = 12;
    const hash = await bcrypt.hash(plainPassword, saltRounds);

    return new Password(hash);
  }

  /**
   * Create Password from existing hash (for loading from DB)
   */
  static createFromHash(hash: string): Password {
    if (!hash || hash.length === 0) {
      throw new BadRequestException('Password hash cannot be empty');
    }
    return new Password(hash);
  }

  /**
   * Verify plain password against this hashed password
   */
  async verify(plainPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, this.hash);
  }

  /**
   * Get password hash
   */
  getHash(): string {
    return this.hash;
  }

  /**
   * Check if passwords are equal
   */
  equals(other: Password): boolean {
    return this.hash === other.hash;
  }
}
