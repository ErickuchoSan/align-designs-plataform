import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from '@prisma/client';
import { PermissionUtils } from '../../common/utils/permission.utils';

/**
 * Service responsible for file and project permission verification
 * Handles all authorization logic for file operations
 */
@Injectable()
export class FilePermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Verify project exists and user has access to it
   * @throws NotFoundException if project not found or deleted
   * @throws ForbiddenException if user lacks access
   */
  async verifyProjectAccess(
    projectId: string,
    userId: string,
    userRole: Role,
    errorMessage?: string,
  ) {
    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        deletedAt: null,
      },
      include: { client: true },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Verify permissions: client can only access their own projects
    PermissionUtils.verifyProjectAccess(
      userRole,
      userId,
      project.clientId,
      errorMessage || 'You do not have access to this project',
    );

    return project;
  }

  /**
   * Verify user can modify a specific file entry
   * @throws NotFoundException if file not found or deleted
   * @throws ForbiddenException if user lacks permission
   */
  async verifyFileModifyPermission(
    fileId: string,
    userId: string,
    userRole: Role,
  ) {
    const file = await this.prisma.file.findFirst({
      where: {
        id: fileId,
        deletedAt: null,
      },
      include: {
        project: true,
      },
    });

    if (!file) {
      throw new NotFoundException('Entry not found');
    }

    // Admin can modify any entry
    if (userRole === Role.ADMIN) {
      return file;
    }

    // Client can only modify their own entries in their own projects
    if (userRole === Role.CLIENT) {
      if (file.uploadedBy !== userId) {
        throw new ForbiddenException('You can only edit your own entries');
      }
      if (file.project.clientId !== userId) {
        throw new ForbiddenException('You do not have access to this project');
      }
    }

    return file;
  }

  /**
   * Verify user can access/view a specific file
   * @throws NotFoundException if file not found or deleted
   * @throws ForbiddenException if user lacks access
   */
  async verifyFileViewPermission(
    fileId: string,
    userId: string,
    userRole: Role,
  ) {
    const file = await this.prisma.file.findFirst({
      where: {
        id: fileId,
        deletedAt: null,
      },
      include: {
        project: true,
      },
    });

    if (!file) {
      throw new NotFoundException('Entry not found');
    }

    // Verify permissions
    PermissionUtils.verifyProjectAccess(
      userRole,
      userId,
      file.project.clientId,
      'You do not have access to this entry',
    );

    return file;
  }

  /**
   * Verify user can delete a specific file entry
   * @throws NotFoundException if file not found or deleted
   * @throws ForbiddenException if user lacks permission
   */
  async verifyFileDeletePermission(
    fileId: string,
    userId: string,
    userRole: Role,
  ) {
    const file = await this.prisma.file.findFirst({
      where: {
        id: fileId,
        deletedAt: null,
      },
      include: {
        project: true,
      },
    });

    if (!file) {
      throw new NotFoundException('Entry not found');
    }

    // Admin can delete any entry
    if (userRole === Role.ADMIN) {
      return file;
    }

    // Client can only delete entries they created themselves in their own projects
    if (userRole === Role.CLIENT) {
      if (file.uploadedBy !== userId) {
        throw new ForbiddenException(
          'You can only delete entries you created yourself',
        );
      }
      if (file.project.clientId !== userId) {
        throw new ForbiddenException('You do not have access to this project');
      }
    }

    return file;
  }
}
