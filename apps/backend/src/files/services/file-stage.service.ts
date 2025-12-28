import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Stage, Role, ProjectStatus } from '@prisma/client';

/**
 * Service for managing file stages and workflow transitions
 *
 * Stage Permissions:
 * - BRIEF_PROJECT: Admin, Client can upload
 * - FEEDBACK_CLIENT: Admin can upload (feedback FOR client)
 * - FEEDBACK_EMPLOYEE: Admin can upload (feedback FOR employee)
 * - REFERENCES: Admin, Client, Employee can upload
 * - SUBMITTED: Employee can upload (their deliverables)
 * - ADMIN_APPROVED: Admin marks files here (approval action)
 * - CLIENT_APPROVED: Admin marks files here after client approval
 * - PAYMENTS: Admin uploads payment-related files
 */
@Injectable()
export class FileStageService {
  private readonly logger = new Logger(FileStageService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Check if user can upload to a specific stage
   */
  canUploadToStage(userRole: Role, stage: Stage): boolean {
    const permissions: Record<Stage, Role[]> = {
      [Stage.BRIEF_PROJECT]: [Role.ADMIN, Role.CLIENT],
      [Stage.FEEDBACK_CLIENT]: [Role.ADMIN],
      [Stage.FEEDBACK_EMPLOYEE]: [Role.ADMIN],
      [Stage.REFERENCES]: [Role.ADMIN, Role.CLIENT, Role.EMPLOYEE],
      [Stage.SUBMITTED]: [Role.EMPLOYEE],
      [Stage.ADMIN_APPROVED]: [Role.ADMIN], // Set by admin approval action
      [Stage.CLIENT_APPROVED]: [Role.ADMIN], // Set by admin after client approval
      [Stage.PAYMENTS]: [Role.ADMIN],
    };

    return permissions[stage].includes(userRole);
  }

  /**
   * Validate that file can be uploaded to project/stage
   */
  async validateFileUpload(
    projectId: string,
    stage: Stage,
    userId: string,
    userRole: Role,
  ): Promise<void> {
    // Check project exists and is active
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        name: true,
        status: true,
        clientId: true,
        employees: {
          where: { employeeId: userId },
        },
      },
    });

    if (!project) {
      throw new BadRequestException(`Project ${projectId} not found`);
    }

    // Only allow uploads to ACTIVE projects
    // (except BRIEF_PROJECT and PAYMENTS which can be added in WAITING_PAYMENT)
    if (
      project.status !== ProjectStatus.ACTIVE &&
      stage !== Stage.BRIEF_PROJECT &&
      stage !== Stage.PAYMENTS
    ) {
      throw new BadRequestException(
        `Can only upload files to ACTIVE projects. Current status: ${project.status}`,
      );
    }

    // Check stage permissions
    if (!this.canUploadToStage(userRole, stage)) {
      throw new ForbiddenException(
        `Role ${userRole} cannot upload to stage ${stage}`,
      );
    }

    // Additional validations based on role
    if (userRole === Role.CLIENT && project.clientId !== userId) {
      throw new ForbiddenException(
        'Clients can only upload to their own projects',
      );
    }

    if (userRole === Role.EMPLOYEE) {
      // Employee must be assigned to project
      if (project.employees.length === 0) {
        throw new ForbiddenException(
          'You are not assigned to this project',
        );
      }
    }
  }

  /**
   * Approve file (move to ADMIN_APPROVED stage)
   */
  async approveFileByAdmin(fileId: string, adminId: string): Promise<any> {
    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
      select: {
        id: true,
        stage: true,
        projectId: true,
        project: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!file) {
      throw new BadRequestException(`File ${fileId} not found`);
    }

    if (file.stage !== Stage.SUBMITTED) {
      throw new BadRequestException(
        `Can only approve files in SUBMITTED stage. Current: ${file.stage}`,
      );
    }

    const updatedFile = await this.prisma.file.update({
      where: { id: fileId },
      data: {
        stage: Stage.ADMIN_APPROVED,
        approvedAdminAt: new Date(),
      },
      include: {
        uploader: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    this.logger.log(
      `File ${fileId} approved by admin ${adminId} in project ${file.project.name}`,
    );

    return updatedFile;
  }

  /**
   * Mark file as client approved (move to CLIENT_APPROVED stage)
   */
  async approveFileByClient(fileId: string, adminId: string): Promise<any> {
    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
      select: {
        id: true,
        stage: true,
        projectId: true,
      },
    });

    if (!file) {
      throw new BadRequestException(`File ${fileId} not found`);
    }

    if (file.stage !== Stage.ADMIN_APPROVED) {
      throw new BadRequestException(
        `Can only mark client-approved files that are already admin-approved. Current: ${file.stage}`,
      );
    }

    const updatedFile = await this.prisma.file.update({
      where: { id: fileId },
      data: {
        stage: Stage.CLIENT_APPROVED,
        approvedClientAt: new Date(),
        pendingPayment: true, // Mark as pending payment to employee
      },
      include: {
        uploader: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    this.logger.log(
      `File ${fileId} marked as CLIENT_APPROVED by admin ${adminId}`,
    );

    return updatedFile;
  }

  /**
   * Get files by stage for a project
   */
  async getFilesByStage(projectId: string, stage: Stage) {
    return this.prisma.file.findMany({
      where: {
        projectId,
        stage,
        deletedAt: null,
      },
      include: {
        uploader: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
      orderBy: {
        uploadedAt: 'desc',
      },
    });
  }

  /**
   * Get stage statistics for a project
   * Useful for progress visualization
   */
  async getProjectStageStats(projectId: string) {
    const files = await this.prisma.file.groupBy({
      by: ['stage'],
      where: {
        projectId,
        deletedAt: null,
      },
      _count: {
        id: true,
      },
    });

    const stats: Record<string, number> = {};

    for (const stage of Object.values(Stage)) {
      const found = files.find((f) => f.stage === stage);
      stats[stage] = found?._count.id || 0;
    }

    return stats;
  }

  /**
   * Get files pending admin approval (SUBMITTED stage)
   */
  async getFilesPendingApproval(projectId?: string) {
    return this.prisma.file.findMany({
      where: {
        stage: Stage.SUBMITTED,
        deletedAt: null,
        ...(projectId && { projectId }),
      },
      include: {
        uploader: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        uploadedAt: 'asc', // Oldest first (FIFO)
      },
    });
  }

  /**
   * Get files pending payment to employees
   */
  async getFilesPendingPayment(projectId?: string) {
    return this.prisma.file.findMany({
      where: {
        stage: Stage.CLIENT_APPROVED,
        pendingPayment: true,
        deletedAt: null,
        ...(projectId && { projectId }),
      },
      include: {
        uploader: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        approvedClientAt: 'asc', // Oldest first
      },
    });
  }
}
