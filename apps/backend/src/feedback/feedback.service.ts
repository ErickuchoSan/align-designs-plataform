import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Service for managing feedback cycles and feedback entries
 *
 * Feedback Cycle Flow:
 * 1. Admin sends first feedback to employee → Creates new cycle (status: open)
 * 2. Admin can add more feedback to the cycle
 * 3. Employee submits deliverable → Cycle status becomes 'submitted'
 * 4. Admin approves → Cycle status becomes 'approved'
 * 5. Admin rejects → Cycle status becomes 'rejected', employee can submit again
 *
 * Time Tracking Rule (12PM):
 * - If feedback sent before 12PM → Start counting from that day at 12PM
 * - If feedback sent after 12PM → Start counting from next day at 12PM
 */
import { NotificationType } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { FEEDBACK_CYCLE_START_HOUR } from '../common/constants/business.constants';

@Injectable()
export class FeedbackService {
  private readonly logger = new Logger(FeedbackService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) { }

  /**
   * Create a new feedback cycle for an employee
   * Called automatically when admin sends first feedback to employee
   */
  async createFeedbackCycle(
    projectId: string,
    employeeId: string,
  ): Promise<any> {
    // Check if employee has an open cycle already
    const existingOpenCycle = await this.prisma.feedbackCycle.findFirst({
      where: {
        projectId,
        employeeId,
        status: 'open',
      },
    });

    if (existingOpenCycle) {
      this.logger.warn(
        `Employee ${employeeId} already has an open feedback cycle in project ${projectId}`,
      );
      return existingOpenCycle;
    }

    // Calculate start date with 12PM rule
    const startDate = this.calculateStartDate(new Date());

    const cycle = await this.prisma.feedbackCycle.create({
      data: {
        projectId,
        employeeId,
        startDate,
        status: 'open',
      },
      include: {
        employee: {
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
            clientId: true,
          },
        },
      },
    });

    this.logger.log(
      `Feedback cycle created for employee ${employeeId} in project ${projectId}. Start date: ${startDate}`,
    );

    await this.sendFeedbackNotification(
      employeeId,
      NotificationType.INFO,
      'New Feedback Cycle',
      `A new feedback cycle has started in project ${cycle.project.name}.`,
      projectId,
    );

    return cycle;
  }

  /**
   * Calculate start date with 12PM rule
   * - If before 12PM today → starts today at 12PM
   * - If after 12PM today → starts tomorrow at 12PM
   */
  calculateStartDate(feedbackCreatedAt: Date): Date {
    const now = new Date(feedbackCreatedAt);
    const noon = new Date(now);
    noon.setHours(FEEDBACK_CYCLE_START_HOUR, 0, 0, 0);

    if (now < noon) {
      // Before 12PM → start today at 12PM
      return noon;
    } else {
      // After 12PM → start tomorrow at 12PM
      const tomorrow = new Date(noon);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow;
    }
  }

  /**
   * Add feedback to an existing cycle
   * If no open cycle exists, creates one first
   */
  async addFeedbackToCycle(
    projectId: string,
    employeeId: string,
    createdBy: string,
    targetAudience: 'client_space' | 'employee_space',
    content?: string,
    fileDocumentId?: string,
  ): Promise<any> {
    // Find or create open cycle
    let cycle = await this.prisma.feedbackCycle.findFirst({
      where: {
        projectId,
        employeeId,
        status: 'open',
      },
      include: {
        feedback: true,
        project: true,
      },
    });

    if (!cycle) {
      // Create new cycle
      const newCycle = await this.createFeedbackCycle(projectId, employeeId);
      // Refetch with feedback relation
      cycle = await this.prisma.feedbackCycle.findUnique({
        where: { id: newCycle.id },
        include: { feedback: true, project: true },
      });
    }

    if (!cycle) {
      throw new Error('Failed to create or find feedback cycle');
    }

    // Get sequence number (count existing feedback in cycle)
    const sequenceInCycle = cycle.feedback ? cycle.feedback.length + 1 : 1;

    // Create feedback entry
    const feedback = await this.prisma.feedback.create({
      data: {
        feedbackCycleId: cycle.id,
        projectId,
        createdBy,
        targetAudience,
        content,
        fileDocumentId,
        sequenceInCycle,
      },
      include: {
        creator: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        cycle: {
          select: {
            id: true,
            startDate: true,
            status: true,
          },
        },
      },
    });

    this.logger.log(
      `Feedback #${sequenceInCycle} added to cycle ${cycle.id} for ${targetAudience}`,
    );

    // Notify target audience
    // Notify target audience
    if (targetAudience === 'employee_space') {
      await this.sendFeedbackNotification(
        employeeId,
        NotificationType.WARNING,
        'New Feedback Received',
        `New feedback received in ${cycle.project.name}`,
        projectId,
      );
    } else if (targetAudience === 'client_space' && cycle.project.clientId) {
      await this.sendFeedbackNotification(
        cycle.project.clientId,
        NotificationType.INFO,
        'New Update on Project',
        `New update available in ${cycle.project.name}`,
        projectId,
      );
    }

    return feedback;
  }

  /**
   * Mark cycle as submitted when employee delivers
   */
  async submitFeedbackCycle(
    cycleId: string,
    submittedFileId: string,
  ): Promise<any> {
    const cycle = await this.prisma.feedbackCycle.findUnique({
      where: { id: cycleId },
      select: { status: true },
    });

    if (!cycle) {
      throw new NotFoundException(`Feedback cycle ${cycleId} not found`);
    }

    if (cycle.status !== 'open') {
      throw new BadRequestException(
        `Cycle must be 'open' to submit. Current status: ${cycle.status}`,
      );
    }

    const updatedCycle = await this.prisma.feedbackCycle.update({
      where: { id: cycleId },
      data: {
        status: 'submitted',
      },
      include: {
        employee: true,
        project: true,
        feedback: {
          include: {
            creator: true,
          },
        },
      },
    });

    // Update the submitted file to link to this cycle
    await this.prisma.file.update({
      where: { id: submittedFileId },
      data: {
        feedbackCycleId: cycleId,
      },
    });

    this.logger.log(
      `Feedback cycle ${cycleId} submitted by employee ${updatedCycle.employeeId}`,
    );

    // Notify Client
    if (updatedCycle.project.clientId) {
      await this.sendFeedbackNotification(
        updatedCycle.project.clientId,
        NotificationType.SUCCESS,
        'Deliverable Submitted',
        `A deliverable has been submitted for review in ${updatedCycle.project.name}`,
        updatedCycle.projectId,
      );
    }

    return updatedCycle;
  }

  /**
   * Approve feedback cycle
   * Called when admin approves employee's submission
   * Also moves all linked files from SUBMITTED to ADMIN_APPROVED
   */
  async approveFeedbackCycle(cycleId: string): Promise<any> {
    const cycle = await this.prisma.feedbackCycle.findUnique({
      where: { id: cycleId },
      select: {
        status: true,
        projectId: true,
        employeeId: true,
      },
    });

    if (!cycle) {
      throw new NotFoundException(`Feedback cycle ${cycleId} not found`);
    }

    if (cycle.status !== 'submitted') {
      throw new BadRequestException(
        `Cycle must be 'submitted' to approve. Current status: ${cycle.status}`,
      );
    }

    // Get all files linked to this cycle that are in SUBMITTED stage
    const submittedFiles = await this.prisma.file.findMany({
      where: {
        feedbackCycleId: cycleId,
        stage: 'SUBMITTED',
        storagePath: { not: null }, // Only actual files, not comments
        deletedAt: null,
      },
      select: { id: true },
    });

    // Validate that there's at least one file to approve
    if (submittedFiles.length === 0) {
      throw new BadRequestException(
        'Cannot approve cycle: No files found in SUBMITTED stage. Ensure employee has uploaded deliverables.',
      );
    }

    // Use transaction to update cycle and files atomically
    const updatedCycle = await this.prisma.$transaction(async (tx) => {
      // Update all linked files to ADMIN_APPROVED
      await tx.file.updateMany({
        where: {
          feedbackCycleId: cycleId,
          stage: 'SUBMITTED',
          storagePath: { not: null },
          deletedAt: null,
        },
        data: {
          stage: 'ADMIN_APPROVED',
          approvedAdminAt: new Date(),
        },
      });

      // Update cycle status
      return tx.feedbackCycle.update({
        where: { id: cycleId },
        data: {
          status: 'approved',
          endDate: new Date(),
        },
        include: {
          employee: true,
          project: true,
          feedback: {
            include: {
              creator: true,
            },
          },
          files: {
            where: { deletedAt: null },
            select: { id: true, stage: true },
          },
        },
      });
    });

    this.logger.log(
      `Feedback cycle ${cycleId} approved. ${submittedFiles.length} file(s) moved to ADMIN_APPROVED`,
    );

    // Notify Employee
    await this.sendFeedbackNotification(
      updatedCycle.employeeId,
      NotificationType.SUCCESS,
      'Deliverable Approved',
      `Your deliverable in ${updatedCycle.project.name} has been APPROVED!`,
      updatedCycle.projectId,
    );

    // Notify Client about new deliverable ready for review
    if (updatedCycle.project.clientId) {
      await this.sendFeedbackNotification(
        updatedCycle.project.clientId,
        NotificationType.INFO,
        'New Deliverable Ready',
        `A deliverable is ready for your review in ${updatedCycle.project.name}.`,
        updatedCycle.projectId,
      );
    }

    return updatedCycle;
  }

  /**
   * Reject feedback cycle
   * Employee can submit again
   * Also increments rejection count on linked files
   */
  async rejectFeedbackCycle(cycleId: string, rejectionReason?: string): Promise<any> {
    const cycle = await this.prisma.feedbackCycle.findUnique({
      where: { id: cycleId },
      select: { status: true },
    });

    if (!cycle) {
      throw new NotFoundException(`Feedback cycle ${cycleId} not found`);
    }

    if (cycle.status !== 'submitted') {
      throw new BadRequestException(
        `Cycle must be 'submitted' to reject. Current status: ${cycle.status}`,
      );
    }

    // Use transaction to update cycle and files atomically
    const updatedCycle = await this.prisma.$transaction(async (tx) => {
      // Increment rejection count on submitted files
      await tx.file.updateMany({
        where: {
          feedbackCycleId: cycleId,
          stage: 'SUBMITTED',
          deletedAt: null,
        },
        data: {
          rejectionCount: { increment: 1 },
          lastRejectedAt: new Date(),
        },
      });

      // Update cycle status back to open
      return tx.feedbackCycle.update({
        where: { id: cycleId },
        data: {
          status: 'open', // Return to open so employee can submit again
        },
        include: {
          employee: true,
          project: true,
        },
      });
    });

    this.logger.log(
      `Feedback cycle ${cycleId} rejected - returned to open status. Reason: ${rejectionReason || 'Not specified'}`,
    );

    // Notify Employee
    const message = rejectionReason
      ? `Your deliverable in ${updatedCycle.project.name} requires changes: ${rejectionReason}`
      : `Your deliverable in ${updatedCycle.project.name} requires changes.`;

    await this.sendFeedbackNotification(
      updatedCycle.employeeId,
      NotificationType.WARNING,
      'Deliverable Rejected',
      message,
      updatedCycle.projectId,
    );

    return {
      ...updatedCycle,
      rejectionReason,
    };
  }

  /**
   * Calculate time elapsed in feedback cycle (in days)
   * From startDate to endDate (or now if still open)
   */
  calculateTimeElapsed(
    startDate: Date,
    endDate?: Date,
  ): {
    days: number;
    hours: number;
    startDate: Date;
    endDate: Date;
  } {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();

    const diffMs = end.getTime() - start.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(
      (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
    );

    return {
      days: diffDays,
      hours: diffHours,
      startDate: start,
      endDate: end,
    };
  }

  /**
   * Get all feedback cycles for a project
   */
  async getProjectFeedbackCycles(projectId: string) {
    return this.prisma.feedbackCycle.findMany({
      where: {
        projectId,
      },
      include: {
        employee: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        feedback: {
          include: {
            creator: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true,
              },
            },
          },
          orderBy: {
            sequenceInCycle: 'asc',
          },
        },
        files: {
          select: {
            id: true,
            filename: true,
            originalName: true,
            uploadedAt: true,
            stage: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Get feedback cycle by ID with full details
   */
  async getFeedbackCycle(cycleId: string) {
    const cycle = await this.prisma.feedbackCycle.findUnique({
      where: { id: cycleId },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        employee: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        feedback: {
          include: {
            creator: {
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
            sequenceInCycle: 'asc',
          },
        },
        files: {
          select: {
            id: true,
            filename: true,
            originalName: true,
            uploadedAt: true,
            stage: true,
            uploader: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!cycle) {
      throw new NotFoundException(`Feedback cycle ${cycleId} not found`);
    }

    // Calculate time elapsed
    const timeElapsed = this.calculateTimeElapsed(
      cycle.startDate,
      cycle.endDate ?? undefined,
    );

    return {
      ...cycle,
      timeElapsed,
    };
  }

  /**
   * Get open (active) feedback cycles
   * Useful for showing pending work
   */
  async getOpenFeedbackCycles(projectId?: string) {
    return this.prisma.feedbackCycle.findMany({
      where: {
        status: 'open',
        ...(projectId && { projectId }),
      },
      include: {
        employee: {
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
        feedback: {
          select: {
            id: true,
            targetAudience: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        startDate: 'asc', // Oldest first
      },
    });
  }

  /**
   * Helper to send feedback notifications
   */
  private async sendFeedbackNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    projectId: string,
  ) {
    await this.notificationsService.create({
      userId,
      type,
      title,
      message,
      link: `/dashboard/projects/${projectId}/feedback`,
    });
  }
}
