import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ProjectStatus } from '@prisma/client';

export interface ClientAnalytics {
  clientInfo: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    createdAt: Date;
  };
  projectStats: {
    total: number;
    active: number;
    completed: number;
    archived: number;
    waitingPayment: number;
  };
  financialStats: {
    totalPaid: number;
    totalInvoiced: number;
    pendingPayments: number;
    averageProjectValue: number;
  };
  recentProjects: Array<{
    id: string;
    name: string;
    status: ProjectStatus;
    createdAt: Date;
    startDate: Date | null;
    deadlineDate: Date | null;
    filesCount: number;
    employeesCount: number;
  }>;
  timeline: Array<{
    date: Date;
    event: string;
    projectId: string | null;
    projectName: string | null;
  }>;
}

/**
 * User Analytics Service
 *
 * Provides comprehensive analytics for clients:
 * - Project statistics
 * - Financial history
 * - Activity timeline
 */
@Injectable()
export class UserAnalyticsService {
  private readonly logger = new Logger(UserAnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get comprehensive analytics for a client
   */
  async getClientAnalytics(clientId: string): Promise<ClientAnalytics> {
    // Verify client exists
    const client = await this.prisma.user.findUnique({
      where: { id: clientId, deletedAt: null },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    if (!client) {
      throw new NotFoundException(`Client ${clientId} not found`);
    }

    if (client.role !== 'CLIENT') {
      throw new NotFoundException(
        `User ${client.email} is not a client (role: ${client.role})`,
      );
    }

    // Get all projects for this client
    const projects = await this.prisma.project.findMany({
      where: {
        clientId,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        status: true,
        createdAt: true,
        startDate: true,
        deadlineDate: true,
        amountPaid: true,
        initialAmountRequired: true,
        _count: {
          select: {
            files: true,
            employees: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate project statistics
    const projectStats = {
      total: projects.length,
      active: projects.filter((p) => p.status === 'ACTIVE').length,
      completed: projects.filter((p) => p.status === 'COMPLETED').length,
      archived: projects.filter((p) => p.status === 'ARCHIVED').length,
      waitingPayment: projects.filter((p) => p.status === 'WAITING_PAYMENT')
        .length,
    };

    // Get invoices for financial stats
    const invoices = await this.prisma.invoice.findMany({
      where: {
        clientId,
      },
      select: {
        totalAmount: true,
        status: true,
      },
    });

    // Calculate financial statistics
    const totalInvoiced = invoices.reduce(
      (sum, inv) => sum + Number(inv.totalAmount),
      0,
    );

    const totalPaid = projects.reduce(
      (sum, proj) => sum + Number(proj.amountPaid),
      0,
    );

    const pendingPayments = invoices.filter(
      (inv) => inv.status === 'SENT' || inv.status === 'OVERDUE',
    ).length;

    const averageProjectValue =
      projects.length > 0
        ? projects.reduce(
            (sum, proj) => sum + Number(proj.initialAmountRequired || 0),
            0,
          ) / projects.length
        : 0;

    const financialStats = {
      totalPaid,
      totalInvoiced,
      pendingPayments,
      averageProjectValue,
    };

    // Get recent projects (last 5)
    const recentProjects = projects.slice(0, 5).map((p) => ({
      id: p.id,
      name: p.name,
      status: p.status,
      createdAt: p.createdAt,
      startDate: p.startDate,
      deadlineDate: p.deadlineDate,
      filesCount: p._count.files,
      employeesCount: p._count.employees,
    }));

    // Build timeline of events
    const timeline: ClientAnalytics['timeline'] = [];

    // Add project creation events
    projects.forEach((project) => {
      timeline.push({
        date: project.createdAt,
        event: `Project "${project.name}" created`,
        projectId: project.id,
        projectName: project.name,
      });

      if (project.startDate) {
        timeline.push({
          date: project.startDate,
          event: `Project "${project.name}" started`,
          projectId: project.id,
          projectName: project.name,
        });
      }
    });

    // Sort timeline by date (most recent first)
    timeline.sort((a, b) => b.date.getTime() - a.date.getTime());

    // Take only last 10 events
    const recentTimeline = timeline.slice(0, 10);

    return {
      clientInfo: {
        id: client.id,
        email: client.email,
        firstName: client.firstName,
        lastName: client.lastName,
        phone: client.phone,
        createdAt: client.createdAt,
      },
      projectStats,
      financialStats,
      recentProjects,
      timeline: recentTimeline,
    };
  }

  /**
   * Get project distribution by status for chart visualization
   */
  async getProjectDistribution(clientId: string): Promise<{
    labels: string[];
    data: number[];
  }> {
    const analytics = await this.getClientAnalytics(clientId);

    return {
      labels: [
        'Waiting Payment',
        'Active',
        'Completed',
        'Archived',
      ],
      data: [
        analytics.projectStats.waitingPayment,
        analytics.projectStats.active,
        analytics.projectStats.completed,
        analytics.projectStats.archived,
      ],
    };
  }

  /**
   * Get monthly project activity for the last 12 months
   */
  async getMonthlyActivity(clientId: string): Promise<{
    labels: string[];
    projectsCreated: number[];
    projectsCompleted: number[];
  }> {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const projects = await this.prisma.project.findMany({
      where: {
        clientId,
        deletedAt: null,
        createdAt: {
          gte: twelveMonthsAgo,
        },
      },
      select: {
        createdAt: true,
        status: true,
        updatedAt: true,
      },
    });

    // Initialize arrays for last 12 months
    const labels: string[] = [];
    const projectsCreated: number[] = [];
    const projectsCompleted: number[] = [];

    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthYear = date.toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      });
      labels.push(monthYear);

      // Count projects created in this month
      const created = projects.filter((p) => {
        const projectMonth = p.createdAt.getMonth();
        const projectYear = p.createdAt.getFullYear();
        return projectMonth === date.getMonth() && projectYear === date.getFullYear();
      }).length;

      // Count projects completed in this month
      const completed = projects.filter((p) => {
        if (p.status !== 'COMPLETED') return false;
        const projectMonth = p.updatedAt.getMonth();
        const projectYear = p.updatedAt.getFullYear();
        return projectMonth === date.getMonth() && projectYear === date.getFullYear();
      }).length;

      projectsCreated.push(created);
      projectsCompleted.push(completed);
    }

    return {
      labels,
      projectsCreated,
      projectsCompleted,
    };
  }
}
