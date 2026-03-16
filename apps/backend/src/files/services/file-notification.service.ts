import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { NotificationType } from '@prisma/client';

@Injectable()
export class FileNotificationService {
  private readonly logger = new Logger(FileNotificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async sendProjectNotifications(
    projectId: string,
    uploaderId: string,
    triggerType: 'FILE' | 'COMMENT',
    resourceName: string | undefined, // Filename or comment preview
  ) {
    try {
      // 1. Get Project Members (Client + Creator + Employees)
      const project = await this.prisma.project.findUnique({
        where: { id: projectId },
        include: {
          employees: true,
          client: { select: { id: true, firstName: true, lastName: true } },
          creator: { select: { id: true, firstName: true, lastName: true } },
        },
      });

      if (!project) return;

      // 2. Get Uploader Name
      const uploader = await this.prisma.user.findUnique({
        where: { id: uploaderId },
        select: { firstName: true, lastName: true, role: true },
      });

      if (!uploader) return;

      const uploaderName = `${uploader.firstName} ${uploader.lastName}`;
      const title =
        triggerType === 'FILE' ? 'New File Uploaded' : 'New Comment';
      const message = this.buildNotificationMessage(
        triggerType,
        uploaderName,
        resourceName,
      );

      const link = `/dashboard/projects/${projectId}/files`;

      // 3. Define Recipients (Everyone except uploader)
      const recipientIds = new Set<string>();

      // Add Client (if not uploader)
      if (project.clientId && project.clientId !== uploaderId) {
        recipientIds.add(project.clientId);
      }

      // Add Creator/Admin (if not uploader)
      if (project.createdBy && project.createdBy !== uploaderId) {
        recipientIds.add(project.createdBy);
      }

      // Add Assigned Employees (if not uploader)
      project.employees.forEach((assignment) => {
        if (assignment.employeeId !== uploaderId) {
          recipientIds.add(assignment.employeeId);
        }
      });

      // 4. Send Notifications
      const notifications = Array.from(recipientIds).map((userId) =>
        this.notificationsService.create({
          userId,
          type: NotificationType.INFO,
          title,
          message,
          link,
        }),
      );

      await Promise.allSettled(notifications);
      this.logger.log(
        `Sent ${notifications.length} notifications for ${triggerType} in project ${projectId}`,
      );
    } catch (error) {
      this.logger.error('Failed to send project notifications', error);
    }
  }

  /**
   * Build notification message based on trigger type
   */
  private buildNotificationMessage(
    triggerType: 'FILE' | 'COMMENT',
    uploaderName: string,
    resourceName: string | undefined,
  ): string {
    if (triggerType === 'FILE') {
      return `${uploaderName} uploaded a new file: ${resourceName || 'Unknown file'}`;
    }
    const commentPreview = this.truncateComment(resourceName);
    return `${uploaderName} commented: "${commentPreview}"`;
  }

  /**
   * Truncate comment for preview
   */
  private truncateComment(comment: string | undefined): string {
    if (!comment) return 'New comment';
    if (comment.length <= 50) return comment;
    return comment.substring(0, 50) + '...';
  }
}
