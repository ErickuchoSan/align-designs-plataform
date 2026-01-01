import { ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';

/**
 * Strategy interface for role-based permissions
 * Implements the Strategy Pattern to comply with Open/Closed Principle
 */
export interface PermissionStrategy {
  /**
   * Verify project access for the specific role
   * @param userId - ID of the user making the request
   * @param projectClientId - Client ID associated with the project
   * @param errorMessage - Custom error message
   */
  verifyProjectAccess(
    userId: string,
    projectClientId: string,
    errorMessage?: string,
  ): void;

  /**
   * Verify user data access for the specific role
   * @param requestUserId - ID of the user making the request
   * @param targetUserId - ID of the user being accessed
   * @param errorMessage - Custom error message
   */
  verifyUserAccess(
    requestUserId: string,
    targetUserId: string,
    errorMessage?: string,
  ): void;

  /**
   * Check if the role has admin privileges
   */
  isAdmin(): boolean;
}

/**
 * Permission strategy for ADMIN role
 * Admins have unrestricted access to all resources
 */
export class AdminPermissionStrategy implements PermissionStrategy {
  verifyProjectAccess(
    userId: string,
    projectClientId: string,
    errorMessage?: string,
  ): void {
    // Admins have access to all projects - no verification needed
  }

  verifyUserAccess(
    requestUserId: string,
    targetUserId: string,
    errorMessage?: string,
  ): void {
    // Admins can access all user data - no verification needed
  }

  isAdmin(): boolean {
    return true;
  }
}

/**
 * Permission strategy for CLIENT role
 * Clients have restricted access to only their own resources
 */
export class ClientPermissionStrategy implements PermissionStrategy {
  verifyProjectAccess(
    userId: string,
    projectClientId: string,
    errorMessage = 'You do not have permission to access this project',
  ): void {
    if (projectClientId !== userId) {
      throw new ForbiddenException(errorMessage);
    }
  }

  verifyUserAccess(
    requestUserId: string,
    targetUserId: string,
    errorMessage = 'You do not have permission to access this user',
  ): void {
    if (requestUserId !== targetUserId) {
      throw new ForbiddenException(errorMessage);
    }
  }

  isAdmin(): boolean {
    return false;
  }
}

/**
 * Permission strategy for EMPLOYEE role
 * Employees have restricted access - verified by assignment in service layer
 */
export class EmployeePermissionStrategy implements PermissionStrategy {
  verifyProjectAccess(
    userId: string,
    projectClientId: string,
    errorMessage = 'You do not have permission to access this project',
  ): void {
    // Employee access is verified by checking project assignment in the service layer
    // This is a placeholder - actual verification happens in ProjectsService
  }

  verifyUserAccess(
    requestUserId: string,
    targetUserId: string,
    errorMessage = 'You do not have permission to access this user',
  ): void {
    if (requestUserId !== targetUserId) {
      throw new ForbiddenException(errorMessage);
    }
  }

  isAdmin(): boolean {
    return false;
  }
}

/**
 * Context class that uses a permission strategy
 * Provides a clean interface for permission checks
 */
export class PermissionContext {
  private strategy: PermissionStrategy;

  constructor(private readonly role: Role) {
    this.strategy = this.createStrategy(role);
  }

  /**
   * Factory method to create the appropriate strategy based on role
   */
  private createStrategy(role: Role): PermissionStrategy {
    switch (role) {
      case Role.ADMIN:
        return new AdminPermissionStrategy();
      case Role.CLIENT:
        return new ClientPermissionStrategy();
      case Role.EMPLOYEE:
        return new EmployeePermissionStrategy();
      default:
        throw new Error(`Unsupported role: ${role}`);
    }
  }

  /**
   * Verify project access using the current strategy
   */
  verifyProjectAccess(
    userId: string,
    projectClientId: string,
    errorMessage?: string,
  ): void {
    this.strategy.verifyProjectAccess(userId, projectClientId, errorMessage);
  }

  /**
   * Verify user access using the current strategy
   */
  verifyUserAccess(
    requestUserId: string,
    targetUserId: string,
    errorMessage?: string,
  ): void {
    this.strategy.verifyUserAccess(requestUserId, targetUserId, errorMessage);
  }

  /**
   * Check if the current role has admin privileges
   */
  isAdmin(): boolean {
    return this.strategy.isAdmin();
  }

  /**
   * Verify that the current role is admin
   */
  verifyAdminRole(
    errorMessage = 'This action requires administrator privileges',
  ): void {
    if (!this.isAdmin()) {
      throw new ForbiddenException(errorMessage);
    }
  }
}
