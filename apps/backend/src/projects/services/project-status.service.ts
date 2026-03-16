import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ProjectStatus, NotificationType, Stage } from '@prisma/client';
import { NotificationsService } from '../../notifications/notifications.service';

export interface ProjectStatusSummary {
  id: string;
  name: string;
  status: ProjectStatus;
  startDate: Date | null;
  deadlineDate: Date | null;
  archivedAt: Date | null;
  paymentProgress: {
    required: number;
    paid: number;
    remaining: number;
    percentage: number;
  } | null;
  employeeCount: number;
  fileCount: number;
  feedbackCycleCount: number;
  canActivate: boolean;
}

/**
 * Service for managing project status transitions
 *
 * Status Flow:
 * WAITING_PAYMENT → ACTIVE → COMPLETED → ARCHIVED
 */
@Injectable()
export class ProjectStatusService {
  private readonly logger = new Logger(ProjectStatusService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Check if project can be activated
   * Requirements:
   * - Must be in WAITING_PAYMENT status
   * - Must have at least one employee assigned
   * - Must have Project Brief defined (at least one file in BRIEF_PROJECT stage)
   * - If initialAmountRequired is set, amountPaid must be >= initialAmountRequired
   */
  async canActivateProject(projectId: string): Promise<{
    canActivate: boolean;
    reason?: string;
    missingRequirements?: string[];
    paymentProgress?: {
      required: number;
      paid: number;
      remaining: number;
    };
  }> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        name: true,
        status: true,
        initialAmountRequired: true,
        amountPaid: true,
      },
    });

    if (!project) {
      throw new BadRequestException(`Project ${projectId} not found`);
    }

    if (project.status !== ProjectStatus.WAITING_PAYMENT) {
      return {
        canActivate: false,
        reason: `Project is already ${project.status}. Can only activate projects in WAITING_PAYMENT status.`,
      };
    }

    // Collect all missing requirements
    const missingRequirements: string[] = [];

    // Check #1: Employee assignment
    const employeeCount = await this.prisma.projectEmployee.count({
      where: { projectId },
    });

    if (employeeCount === 0) {
      missingRequirements.push(
        'No employee assigned. Please assign at least one employee to the project.',
      );
    }

    // Check #2: Project Brief (at least one file in BRIEF_PROJECT stage)
    const briefFileCount = await this.prisma.file.count({
      where: {
        projectId,
        stage: Stage.BRIEF_PROJECT,
        deletedAt: null,
      },
    });

    if (briefFileCount === 0) {
      missingRequirements.push(
        'No Project Brief. Please upload at least one file to the Brief stage.',
      );
    }

    // Check #3: Payment amount configured
    if (project.initialAmountRequired === null) {
      missingRequirements.push(
        'Payment amount not configured. Please edit project to set an Initial Amount (use 0 for free projects).',
      );
    }

    // If there are missing requirements, return early
    if (missingRequirements.length > 0) {
      return {
        canActivate: false,
        reason: missingRequirements.join(' '),
        missingRequirements,
      };
    }

    // Check #4: Payment completion
    const required = Number(project.initialAmountRequired);
    const paid = Number(project.amountPaid || 0);
    const remaining = required - paid;

    this.logger.log(
      `Payment validation for project ${project.name}: Required=$${required}, Paid=$${paid}, Remaining=$${remaining}`,
    );

    if (paid < required) {
      return {
        canActivate: false,
        reason: `Initial payment not complete. Received $${paid.toFixed(2)} of $${required.toFixed(2)} required.`,
        missingRequirements: [
          `Initial payment not complete. Received $${paid.toFixed(2)} of $${required.toFixed(2)} required.`,
        ],
        paymentProgress: {
          required,
          paid,
          remaining,
        },
      };
    }

    return {
      canActivate: true,
      paymentProgress: {
        required,
        paid,
        remaining: 0,
      },
    };
  }

  /**
   * Activate a project
   * Auto-activates if payment requirements are met
   */
  async activateProject(projectId: string): Promise<any> {
    const validation = await this.canActivateProject(projectId);

    if (!validation.canActivate) {
      throw new BadRequestException(validation.reason);
    }

    const updatedProject = await this.prisma.project.update({
      where: { id: projectId },
      data: {
        status: ProjectStatus.ACTIVE,
        startDate: new Date(), // Set start date when activated
      },
      include: {
        client: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        employees: {
          include: {
            employee: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    // Notify Client and Employees (Non-blocking)
    try {
      if (updatedProject.client) {
        await this.notificationsService.create({
          userId: updatedProject.client.id,
          type: NotificationType.SUCCESS,
          title: 'Project Activated',
          message: `Your project "${updatedProject.name}" is now ACTIVE. Work has begun!`,
          link: `/dashboard/projects/${projectId}`,
        });
      }

      for (const emp of updatedProject.employees) {
        if (emp.employee) {
          await this.notificationsService.create({
            userId: emp.employee.id,
            type: NotificationType.INFO,
            title: 'Project Activated',
            message: `Project "${updatedProject.name}" is now ACTIVE. You can start working.`,
            link: `/dashboard/projects/${projectId}`,
          });
        }
      }
    } catch (error) {
      this.logger.error(
        `Failed to send activation notifications for project ${projectId}`,
        error,
      );
      // Suppress error so activation successful response is returned
    }

    this.logger.log(
      `Project ${updatedProject.name} activated - assigned to ${updatedProject.employees.length} employee(s)`,
    );

    return updatedProject;
  }

  /**
   * Complete a project
   * Transition from ACTIVE to COMPLETED
   */
  async completeProject(projectId: string): Promise<any> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { status: true, name: true },
    });

    if (!project) {
      throw new BadRequestException(`Project ${projectId} not found`);
    }

    if (project.status !== ProjectStatus.ACTIVE) {
      throw new BadRequestException(
        `Project must be ACTIVE to complete. Current status: ${project.status}`,
      );
    }

    const updatedProject = await this.prisma.project.update({
      where: { id: projectId },
      data: {
        status: ProjectStatus.COMPLETED,
      },
      include: {
        client: true,
        employees: {
          include: {
            employee: true,
          },
        },
      },
    });

    // Notify Client
    if (updatedProject.client) {
      await this.notificationsService.create({
        userId: updatedProject.client.id,
        type: NotificationType.SUCCESS,
        title: 'Project Completed',
        message: `Your project "${updatedProject.name}" has been marked as COMPLETED.`,
        link: `/dashboard/projects/${projectId}`,
      });
    }

    // Notify Employees
    for (const emp of updatedProject.employees) {
      if (emp.employee) {
        await this.notificationsService.create({
          userId: emp.employee.id,
          type: NotificationType.SUCCESS,
          title: 'Project Completed',
          message: `Project "${updatedProject.name}" is now COMPLETED. Great job!`,
          link: `/dashboard/projects/${projectId}`,
        });
      }
    }

    this.logger.log(`Project ${updatedProject.name} marked as COMPLETED`);

    return updatedProject;
  }

  /**
   * Archive a project
   * Transition from COMPLETED to ARCHIVED
   */
  async archiveProject(projectId: string): Promise<any> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { status: true, name: true },
    });

    if (!project) {
      throw new BadRequestException(`Project ${projectId} not found`);
    }

    if (project.status !== ProjectStatus.COMPLETED) {
      throw new BadRequestException(
        `Project must be COMPLETED to archive. Current status: ${project.status}`,
      );
    }

    const updatedProject = await this.prisma.project.update({
      where: { id: projectId },
      data: {
        status: ProjectStatus.ARCHIVED,
        archivedAt: new Date(),
      },
    });

    this.logger.log(
      `Project ${updatedProject.name} archived at ${updatedProject.archivedAt}`,
    );

    return updatedProject;
  }

  /**
   * Update project's paid amount
   * May auto-activate if payment complete
   */
  async updateProjectPayment(
    projectId: string,
    additionalAmount: number,
  ): Promise<{
    project: any;
    activated: boolean;
  }> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        name: true,
        status: true,
        initialAmountRequired: true,
        amountPaid: true,
      },
    });

    if (!project) {
      throw new BadRequestException(`Project ${projectId} not found`);
    }

    const newTotal = Number(project.amountPaid) + additionalAmount;

    const updatedProject = await this.prisma.project.update({
      where: { id: projectId },
      data: {
        amountPaid: newTotal,
      },
      include: {
        client: true,
        employees: {
          include: {
            employee: true,
          },
        },
      },
    });

    this.logger.log(
      `Payment added to project ${project.name}: +$${additionalAmount} (total: $${newTotal})`,
    );

    // Check if should auto-activate
    let activated = false;
    if (project.status === ProjectStatus.WAITING_PAYMENT) {
      const validation = await this.canActivateProject(projectId);

      if (validation.canActivate) {
        await this.activateProject(projectId);
        activated = true;
        this.logger.log(
          `Project ${project.name} AUTO-ACTIVATED after payment completion`,
        );
      }
    }

    return {
      project: updatedProject,
      activated,
    };
  }

  /**
   * Get project status summary
   * Useful for dashboards and status displays
   */

  // ...
  async getProjectStatusSummary(
    projectId: string,
  ): Promise<ProjectStatusSummary> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        employees: {
          include: {
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        _count: {
          select: {
            files: true,
            feedbackCycles: true,
          },
        },
      },
    });

    if (!project) {
      throw new BadRequestException(`Project ${projectId} not found`);
    }

    const paymentProgress = project.initialAmountRequired
      ? {
          required: Number(project.initialAmountRequired),
          paid: Number(project.amountPaid),
          remaining:
            Number(project.initialAmountRequired) - Number(project.amountPaid),
          percentage:
            (Number(project.amountPaid) /
              Number(project.initialAmountRequired)) *
            100,
        }
      : null;

    return {
      id: project.id,
      name: project.name,
      status: project.status,
      startDate: project.startDate,
      deadlineDate: project.deadlineDate,
      archivedAt: project.archivedAt,
      paymentProgress,
      employeeCount: project.employees.length,
      fileCount: project._count.files,
      feedbackCycleCount: project._count.feedbackCycles,
      canActivate:
        project.status === ProjectStatus.WAITING_PAYMENT
          ? (await this.canActivateProject(projectId)).canActivate
          : false,
    };
  }
}
