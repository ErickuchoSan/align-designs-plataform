import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Stage, Role, ProjectStatus, NotificationType } from '@prisma/client';
import { NotificationsService } from '../../notifications/notifications.service';

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
import { TimeTrackingService } from '../../tracking/time-tracking.service';

@Injectable()
export class FileStageService {
  private readonly logger = new Logger(FileStageService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly timeTrackingService: TimeTrackingService,
    private readonly notificationsService: NotificationsService,
  ) { }

  // ... existing methods ...

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
        feedbackCycleId: true, // Fetch cycle ID
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

    // Stop Time Tracking for the linked cycle if exists
    if (file.feedbackCycleId) {
      await this.timeTrackingService.endTracking(file.feedbackCycleId, fileId);
      this.logger.log(`Time tracking ended for cycle ${file.feedbackCycleId} via file approval ${fileId}`);
    }

    this.logger.log(
      `File ${fileId} marked as CLIENT_APPROVED by admin ${adminId}`,
    );

    // Notify Employee (Uploader)
    if (updatedFile.uploader) {
      await this.notificationsService.create({
        userId: updatedFile.uploader.id,
        type: NotificationType.SUCCESS,
        title: 'File Approved by Client',
        message: `Your file has been approved by the client! Pending payment.`,
        link: `/dashboard/projects/${updatedFile.projectId}/files`,
      });
    }

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
