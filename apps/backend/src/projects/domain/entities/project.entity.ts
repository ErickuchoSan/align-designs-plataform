import { ForbiddenException, BadRequestException } from '@nestjs/common';
import { Role } from '@prisma/client';

/**
 * Project Domain Entity
 * Represents a project with encapsulated business logic
 * Ensures business rules are always respected
 */
export class ProjectEntity {
  private constructor(
    private readonly id: string,
    private name: string,
    private description: string | null,
    private clientId: string,
    private readonly createdBy: string,
    private readonly createdAt: Date,
    private updatedAt: Date,
    private deletedAt: Date | null = null,
  ) {}

  /**
   * Factory method to create new Project
   */
  static create(params: {
    id: string;
    name: string;
    description?: string;
    clientId: string;
    createdBy: string;
  }): ProjectEntity {
    // Business rules validation
    if (!params.name || params.name.trim().length === 0) {
      throw new BadRequestException('Project name cannot be empty');
    }

    if (params.name.length > 255) {
      throw new BadRequestException(
        'Project name cannot exceed 255 characters',
      );
    }

    if (params.description && params.description.length > 5000) {
      throw new BadRequestException(
        'Project description cannot exceed 5000 characters',
      );
    }

    return new ProjectEntity(
      params.id,
      params.name.trim(),
      params.description?.trim() || null,
      params.clientId,
      params.createdBy,
      new Date(),
      new Date(),
      null,
    );
  }

  /**
   * Reconstitute Project from database
   */
  static reconstitute(params: {
    id: string;
    name: string;
    description: string | null;
    clientId: string;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  }): ProjectEntity {
    return new ProjectEntity(
      params.id,
      params.name,
      params.description,
      params.clientId,
      params.createdBy,
      params.createdAt,
      params.updatedAt,
      params.deletedAt,
    );
  }

  // Business logic methods

  /**
   * Update project details
   * Business rule: Only admins and project creator can update
   */
  update(
    params: {
      name?: string;
      description?: string;
      clientId?: string;
    },
    userId: string,
    userRole: Role,
  ): void {
    // Check permissions
    if (userRole !== Role.ADMIN && this.createdBy !== userId) {
      throw new ForbiddenException(
        'Only admins and project creators can update projects',
      );
    }

    // Validate and update name
    if (params.name !== undefined) {
      if (!params.name || params.name.trim().length === 0) {
        throw new BadRequestException('Project name cannot be empty');
      }
      if (params.name.length > 255) {
        throw new BadRequestException(
          'Project name cannot exceed 255 characters',
        );
      }
      this.name = params.name.trim();
    }

    // Validate and update description
    if (params.description !== undefined) {
      if (params.description && params.description.length > 5000) {
        throw new BadRequestException(
          'Project description cannot exceed 5000 characters',
        );
      }
      this.description = params.description?.trim() || null;
    }

    // Update client (business rule: only admins can change client)
    if (params.clientId !== undefined) {
      if (userRole !== Role.ADMIN) {
        throw new ForbiddenException('Only admins can change project client');
      }
      this.clientId = params.clientId;
    }

    this.updatedAt = new Date();
  }

  /**
   * Soft delete project
   * Business rule: Only admins can delete projects
   */
  softDelete(userId: string, userRole: Role): void {
    if (userRole !== Role.ADMIN) {
      throw new ForbiddenException('Only admins can delete projects');
    }

    if (this.deletedAt) {
      throw new BadRequestException('Project is already deleted');
    }

    this.deletedAt = new Date();
    this.updatedAt = new Date();
  }

  /**
   * Restore soft-deleted project
   * Business rule: Only admins can restore projects
   */
  restore(userId: string, userRole: Role): void {
    if (userRole !== Role.ADMIN) {
      throw new ForbiddenException('Only admins can restore projects');
    }

    if (!this.deletedAt) {
      throw new BadRequestException('Project is not deleted');
    }

    this.deletedAt = null;
    this.updatedAt = new Date();
  }

  /**
   * Check if user can access project
   */
  canBeAccessedBy(userId: string, userRole: Role): boolean {
    // Admins can access all projects
    if (userRole === Role.ADMIN) {
      return true;
    }

    // Clients can only access their own projects
    if (userRole === Role.CLIENT) {
      return this.clientId === userId;
    }

    return false;
  }

  /**
   * Check if user can modify project
   */
  canBeModifiedBy(userId: string, userRole: Role): boolean {
    // Admins can modify all projects
    if (userRole === Role.ADMIN) {
      return true;
    }

    // Project creator can modify
    return this.createdBy === userId;
  }

  /**
   * Check if project is active (not deleted)
   */
  isActive(): boolean {
    return this.deletedAt === null;
  }

  /**
   * Check if project is deleted
   */
  isDeleted(): boolean {
    return this.deletedAt !== null;
  }

  // Getters
  getId(): string {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  getDescription(): string | null {
    return this.description;
  }

  getClientId(): string {
    return this.clientId;
  }

  getCreatedBy(): string {
    return this.createdBy;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  getDeletedAt(): Date | null {
    return this.deletedAt;
  }

  /**
   * Convert to plain object for persistence
   */
  toPersistence(): {
    id: string;
    name: string;
    description: string | null;
    clientId: string;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  } {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      clientId: this.clientId,
      createdBy: this.createdBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
    };
  }
}
