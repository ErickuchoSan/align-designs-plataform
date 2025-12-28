import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ProjectStatus } from '@prisma/client';

/**
 * Service for managing employee assignments to projects
 *
 * CRITICAL BUSINESS RULE:
 * An employee can ONLY be assigned to ONE active project at a time.
 * They cannot be assigned to a new project until their current project
 * is COMPLETED or ARCHIVED.
 */
@Injectable()
export class ProjectEmployeeService {
  private readonly logger = new Logger(ProjectEmployeeService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Assign employees to a project
   * Validates that each employee is not already assigned to another active project
   */
  async assignEmployeesToProject(
    projectId: string,
    employeeIds: string[],
  ): Promise<void> {
    // Validate that project exists
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, name: true, status: true },
    });

    if (!project) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }

    // Validate each employee before assigning
    for (const employeeId of employeeIds) {
      await this.validateEmployeeAvailability(employeeId, projectId);
    }

    // Assign all employees (transaction to ensure atomicity)
    await this.prisma.$transaction(
      employeeIds.map((employeeId) =>
        this.prisma.projectEmployee.create({
          data: {
            projectId,
            employeeId,
          },
        }),
      ),
    );

    this.logger.log(
      `Assigned ${employeeIds.length} employee(s) to project ${project.name}`,
    );
  }

  /**
   * CRITICAL VALIDATION:
   * Check if employee can be assigned to this project
   *
   * Rules:
   * - Employee must exist and have role EMPLOYEE
   * - Employee cannot be assigned to another ACTIVE project
   * - Employee CAN be assigned to WAITING_PAYMENT, COMPLETED, or ARCHIVED projects
   */
  async validateEmployeeAvailability(
    employeeId: string,
    newProjectId?: string,
  ): Promise<{
    canAssign: boolean;
    reason?: string;
    currentProject?: {
      id: string;
      name: string;
      status: ProjectStatus;
    };
  }> {
    // Check if user exists and is an employee
    const user = await this.prisma.user.findUnique({
      where: { id: employeeId },
      select: { id: true, email: true, role: true, isActive: true },
    });

    if (!user) {
      throw new NotFoundException(`User ${employeeId} not found`);
    }

    if (user.role !== 'EMPLOYEE') {
      throw new BadRequestException(
        `User ${user.email} is not an employee (role: ${user.role})`,
      );
    }

    if (!user.isActive) {
      throw new BadRequestException(
        `Employee ${user.email} is not active`,
      );
    }

    // Check if employee is already assigned to an ACTIVE project
    const activeAssignments = await this.prisma.projectEmployee.findMany({
      where: {
        employeeId,
        project: {
          status: ProjectStatus.ACTIVE,
          deletedAt: null,
          // Exclude the new project if provided (for updates)
          ...(newProjectId && { id: { not: newProjectId } }),
        },
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    });

    if (activeAssignments.length > 0) {
      const currentProject = activeAssignments[0].project;

      this.logger.warn(
        `Employee ${employeeId} cannot be assigned - already working on active project: ${currentProject.name}`,
      );

      return {
        canAssign: false,
        reason: `Employee is already assigned to active project: ${currentProject.name}`,
        currentProject,
      };
    }

    return {
      canAssign: true,
    };
  }

  /**
   * Remove employee from project
   */
  async removeEmployeeFromProject(
    projectId: string,
    employeeId: string,
  ): Promise<void> {
    const assignment = await this.prisma.projectEmployee.findUnique({
      where: {
        projectId_employeeId: {
          projectId,
          employeeId,
        },
      },
    });

    if (!assignment) {
      throw new NotFoundException(
        `Employee ${employeeId} is not assigned to project ${projectId}`,
      );
    }

    await this.prisma.projectEmployee.delete({
      where: {
        projectId_employeeId: {
          projectId,
          employeeId,
        },
      },
    });

    this.logger.log(
      `Removed employee ${employeeId} from project ${projectId}`,
    );
  }

  /**
   * Get all employees assigned to a project
   */
  async getProjectEmployees(projectId: string) {
    return this.prisma.projectEmployee.findMany({
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
            phone: true,
            isActive: true,
          },
        },
      },
      orderBy: {
        assignedAt: 'asc',
      },
    });
  }

  /**
   * Get all projects assigned to an employee
   * Useful for employee dashboard
   */
  async getEmployeeProjects(employeeId: string) {
    return this.prisma.projectEmployee.findMany({
      where: {
        employeeId,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            description: true,
            status: true,
            startDate: true,
            deadlineDate: true,
            client: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
            _count: {
              select: {
                files: true,
              },
            },
          },
        },
      },
      orderBy: {
        assignedAt: 'desc',
      },
    });
  }

  /**
   * Get employee's current active project (if any)
   */
  async getEmployeeActiveProject(employeeId: string) {
    const activeAssignment = await this.prisma.projectEmployee.findFirst({
      where: {
        employeeId,
        project: {
          status: ProjectStatus.ACTIVE,
          deletedAt: null,
        },
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            description: true,
            status: true,
            startDate: true,
            deadlineDate: true,
            client: {
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

    return activeAssignment?.project || null;
  }

  /**
   * Check if employee has any active assignments
   * Used for UI to show availability status
   */
  async isEmployeeAvailable(employeeId: string): Promise<boolean> {
    const validation = await this.validateEmployeeAvailability(employeeId);
    return validation.canAssign;
  }
}
