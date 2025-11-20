import { Role } from '@prisma/client';
import { Email } from '../../../common/domain/value-objects/email.vo';
import { Password } from '../../../common/domain/value-objects/password.vo';
import { ForbiddenException } from '@nestjs/common';

/**
 * User Domain Entity
 * Represents a user in the system with encapsulated business logic
 * Ensures business rules are always respected
 */
export class UserEntity {
  private constructor(
    private readonly id: string,
    private email: Email,
    private firstName: string,
    private lastName: string,
    private role: Role,
    private isActive: boolean,
    private emailVerified: boolean,
    private passwordHash?: Password,
    private phone?: string,
    private readonly createdAt?: Date,
    private updatedAt?: Date,
  ) {}

  /**
   * Factory method to create new User
   */
  static create(params: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: Role;
    isActive?: boolean;
    emailVerified?: boolean;
    passwordHash?: string;
    phone?: string;
  }): UserEntity {
    return new UserEntity(
      params.id,
      Email.create(params.email),
      params.firstName,
      params.lastName,
      params.role,
      params.isActive ?? true,
      params.emailVerified ?? false,
      params.passwordHash
        ? Password.createFromHash(params.passwordHash)
        : undefined,
      params.phone,
      new Date(),
      new Date(),
    );
  }

  /**
   * Reconstitute User from database
   */
  static reconstitute(params: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: Role;
    isActive: boolean;
    emailVerified: boolean;
    passwordHash?: string;
    phone?: string;
    createdAt: Date;
    updatedAt: Date;
  }): UserEntity {
    return new UserEntity(
      params.id,
      Email.create(params.email),
      params.firstName,
      params.lastName,
      params.role,
      params.isActive,
      params.emailVerified,
      params.passwordHash
        ? Password.createFromHash(params.passwordHash)
        : undefined,
      params.phone,
      params.createdAt,
      params.updatedAt,
    );
  }

  // Business logic methods

  /**
   * Set password for user
   * Business rule: User must not already have a password
   */
  async setPassword(newPassword: Password): Promise<void> {
    if (this.passwordHash) {
      throw new ForbiddenException('User already has a password configured');
    }
    this.passwordHash = newPassword;
    this.updatedAt = new Date();
  }

  /**
   * Change password
   * Business rule: Must verify current password first
   */
  async changePassword(
    currentPlain: string,
    newPassword: Password,
  ): Promise<void> {
    if (!this.passwordHash) {
      throw new ForbiddenException('User does not have a password configured');
    }

    const isValid = await this.passwordHash.verify(currentPlain);
    if (!isValid) {
      throw new ForbiddenException('Current password is incorrect');
    }

    this.passwordHash = newPassword;
    this.updatedAt = new Date();
  }

  /**
   * Verify password
   */
  async verifyPassword(plainPassword: string): Promise<boolean> {
    if (!this.passwordHash) {
      return false;
    }
    return this.passwordHash.verify(plainPassword);
  }

  /**
   * Activate user
   * Business rule: Only admins can activate users (checked in service)
   */
  activate(): void {
    this.isActive = true;
    this.updatedAt = new Date();
  }

  /**
   * Deactivate user
   * Business rule: Only admins can deactivate users (checked in service)
   */
  deactivate(): void {
    this.isActive = false;
    this.updatedAt = new Date();
  }

  /**
   * Verify email
   */
  verifyEmail(): void {
    this.emailVerified = true;
    this.updatedAt = new Date();
  }

  /**
   * Update profile
   */
  updateProfile(params: {
    firstName?: string;
    lastName?: string;
    phone?: string;
  }): void {
    if (params.firstName) this.firstName = params.firstName;
    if (params.lastName) this.lastName = params.lastName;
    if (params.phone !== undefined) this.phone = params.phone;
    this.updatedAt = new Date();
  }

  /**
   * Check if user is admin
   */
  isAdmin(): boolean {
    return this.role === Role.ADMIN;
  }

  /**
   * Check if user is client
   */
  isClient(): boolean {
    return this.role === Role.CLIENT;
  }

  /**
   * Check if user can access resource
   */
  canAccess(resourceOwnerId: string): boolean {
    // Admin can access all resources
    if (this.isAdmin()) {
      return true;
    }
    // Others can only access their own resources
    return this.id === resourceOwnerId;
  }

  // Getters
  getId(): string {
    return this.id;
  }

  getEmail(): Email {
    return this.email;
  }

  getEmailValue(): string {
    return this.email.getValue();
  }

  getFirstName(): string {
    return this.firstName;
  }

  getLastName(): string {
    return this.lastName;
  }

  getFullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  getRole(): Role {
    return this.role;
  }

  getIsActive(): boolean {
    return this.isActive;
  }

  getEmailVerified(): boolean {
    return this.emailVerified;
  }

  getPasswordHash(): string | undefined {
    return this.passwordHash?.getHash();
  }

  getPhone(): string | undefined {
    return this.phone;
  }

  getCreatedAt(): Date | undefined {
    return this.createdAt;
  }

  getUpdatedAt(): Date | undefined {
    return this.updatedAt;
  }

  /**
   * Convert to plain object for persistence
   */
  toPersistence(): {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: Role;
    isActive: boolean;
    emailVerified: boolean;
    passwordHash?: string;
    phone?: string;
    updatedAt: Date;
  } {
    return {
      id: this.id,
      email: this.email.getValue(),
      firstName: this.firstName,
      lastName: this.lastName,
      role: this.role,
      isActive: this.isActive,
      emailVerified: this.emailVerified,
      passwordHash: this.passwordHash?.getHash(),
      phone: this.phone,
      updatedAt: this.updatedAt || new Date(),
    };
  }
}
