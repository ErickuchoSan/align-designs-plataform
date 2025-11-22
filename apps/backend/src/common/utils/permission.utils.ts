import { Role } from '@prisma/client';
import { PermissionContext } from '../strategies/permission.strategy';

/**
 * Utility class for permission validation
 * Refactored to use Strategy Pattern for better extensibility (OCP compliance)
 *
 * @deprecated Use PermissionContext directly for new code
 * This class is maintained for backward compatibility
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
    const context = new PermissionContext(userRole);
    context.verifyProjectAccess(userId, projectClientId, errorMessage);
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
    const context = new PermissionContext(userRole);
    context.verifyAdminRole(errorMessage);
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
    const context = new PermissionContext(userRole);
    context.verifyUserAccess(requestUserId, targetUserId, errorMessage);
  }
}
