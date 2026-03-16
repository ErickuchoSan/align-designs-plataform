import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from '@prisma/client';

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

    // ADMIN: Full access to all projects
    if (userRole === Role.ADMIN) {
      return project;
    }

    // CLIENT: Can only access their own projects
    if (userRole === Role.CLIENT) {
      if (project.clientId !== userId) {
        throw new ForbiddenException(
          errorMessage || 'You do not have access to this project',
        );
      }
      return project;
    }

    // EMPLOYEE: Must be assigned to the project
    if (userRole === Role.EMPLOYEE) {
      const assignment = await this.prisma.projectEmployee.findUnique({
        where: {
          projectId_employeeId: {
            projectId,
            employeeId: userId,
          },
        },
      });

      if (!assignment) {
        throw new ForbiddenException(
          errorMessage || 'You are not assigned to this project',
        );
      }
      return project;
    }

    // Default: deny access for unknown roles
    throw new ForbiddenException(
      errorMessage || 'You do not have access to this project',
    );
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
      return file;
    }

    // Employee can only modify their own entries in projects they're assigned to
    if (userRole === Role.EMPLOYEE) {
      // First verify project assignment
      const assignment = await this.prisma.projectEmployee.findUnique({
        where: {
          projectId_employeeId: {
            projectId: file.projectId,
            employeeId: userId,
          },
        },
      });

      if (!assignment) {
        throw new ForbiddenException('You are not assigned to this project');
      }

      // Then verify ownership
      if (file.uploadedBy !== userId) {
        throw new ForbiddenException('You can only edit your own entries');
      }
      return file;
    }

    throw new ForbiddenException(
      'You do not have permission to edit this entry',
    );
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

    // Admin can view any file
    if (userRole === Role.ADMIN) {
      return file;
    }

    // Client can only view files in their own projects
    if (userRole === Role.CLIENT) {
      if (file.project.clientId !== userId) {
        throw new ForbiddenException('You do not have access to this entry');
      }
      return file;
    }

    // Employee can only view files in projects they're assigned to
    if (userRole === Role.EMPLOYEE) {
      const assignment = await this.prisma.projectEmployee.findUnique({
        where: {
          projectId_employeeId: {
            projectId: file.projectId,
            employeeId: userId,
          },
        },
      });

      if (!assignment) {
        throw new ForbiddenException('You are not assigned to this project');
      }
      return file;
    }

    throw new ForbiddenException('You do not have access to this entry');
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
      return file;
    }

    // Employee can only delete entries they created in projects they're assigned to
    if (userRole === Role.EMPLOYEE) {
      // First verify project assignment
      const assignment = await this.prisma.projectEmployee.findUnique({
        where: {
          projectId_employeeId: {
            projectId: file.projectId,
            employeeId: userId,
          },
        },
      });

      if (!assignment) {
        throw new ForbiddenException('You are not assigned to this project');
      }

      // Then verify ownership
      if (file.uploadedBy !== userId) {
        throw new ForbiddenException(
          'You can only delete entries you created yourself',
        );
      }
      return file;
    }

    throw new ForbiddenException(
      'You do not have permission to delete this entry',
    );
  }
}
