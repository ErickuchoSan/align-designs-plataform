import { ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';

/**
 * Utility class for permission validation
 * Centralizes common permission checks to avoid code duplication
 */
export class PermissionUtils {
  /**
   * Verify that a client user has access to a project
   * Admins always have access, clients only to their own projects
   *
   * @param userRole - The role of the user making the request
   * @param userId - The ID of the user making the request
   * @param projectClientId - The client ID of the project
   * @param errorMessage - Custom error message (optional)
   * @throws ForbiddenException if the user doesn't have permission
   */
  static verifyProjectAccess(
    userRole: Role,
    userId: string,
    projectClientId: string,
    errorMessage = 'You do not have permission to access this project',
  ): void {
    if (userRole === Role.CLIENT && projectClientId !== userId) {
      throw new ForbiddenException(errorMessage);
    }
  }

  /**
   * Verify that a user has admin role
   *
   * @param userRole - The role of the user making the request
   * @param errorMessage - Custom error message (optional)
   * @throws ForbiddenException if the user is not an admin
   */
  static verifyAdminRole(
    userRole: Role,
    errorMessage = 'This action requires administrator privileges',
  ): void {
    if (userRole !== Role.ADMIN) {
      throw new ForbiddenException(errorMessage);
    }
  }

  /**
   * Verify that a client user can only access their own user data
   * Admins can access any user data
   *
   * @param userRole - The role of the user making the request
   * @param requestUserId - The ID of the user making the request
   * @param targetUserId - The ID of the user being accessed
   * @param errorMessage - Custom error message (optional)
   * @throws ForbiddenException if the user doesn't have permission
   */
  static verifyUserAccess(
    userRole: Role,
    requestUserId: string,
    targetUserId: string,
    errorMessage = 'You do not have permission to access this user',
  ): void {
    if (userRole === Role.CLIENT && requestUserId !== targetUserId) {
      throw new ForbiddenException(errorMessage);
    }
  }
}
