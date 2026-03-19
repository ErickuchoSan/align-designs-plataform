import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UserAnalyticsService } from './user-analytics.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ProjectStatus, InvoiceStatus, Role } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

describe('UserAnalyticsService', () => {
  let service: UserAnalyticsService;
  let prismaService: any;

  const mockClientId = 'client-123';
  const mockClient = {
    id: mockClientId,
    email: 'client@test.com',
    firstName: 'Test',
    lastName: 'Client',
    phone: '555-1234',
    role: Role.CLIENT,
    createdAt: new Date('2024-01-01'),
  };

  const mockProjects = [
    {
      id: 'project-1',
      name: 'Project Alpha',
      status: ProjectStatus.ACTIVE,
      createdAt: new Date('2024-01-15'),
      startDate: new Date('2024-01-20'),
      deadlineDate: new Date('2024-03-15'),
      amountPaid: new Decimal(1000),
      initialAmountRequired: new Decimal(2000),
      _count: { files: 5, employees: 2 },
    },
    {
      id: 'project-2',
      name: 'Project Beta',
      status: ProjectStatus.COMPLETED,
      createdAt: new Date('2023-06-01'),
      startDate: new Date('2023-06-15'),
      deadlineDate: null,
      amountPaid: new Decimal(3000),
      initialAmountRequired: new Decimal(3000),
      _count: { files: 10, employees: 3 },
    },
    {
      id: 'project-3',
      name: 'Project Gamma',
      status: ProjectStatus.WAITING_PAYMENT,
      createdAt: new Date('2024-02-01'),
      startDate: null,
      deadlineDate: null,
      amountPaid: new Decimal(0),
      initialAmountRequired: new Decimal(1500),
      _count: { files: 2, employees: 1 },
    },
  ];

  const mockInvoices = [
    { totalAmount: new Decimal(2000), status: InvoiceStatus.PAID },
    { totalAmount: new Decimal(3000), status: InvoiceStatus.PAID },
    { totalAmount: new Decimal(1500), status: InvoiceStatus.SENT },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserAnalyticsService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
            },
            project: {
              findMany: jest.fn(),
            },
            invoice: {
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<UserAnalyticsService>(UserAnalyticsService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getClientAnalytics', () => {
    it('should return comprehensive analytics for a client', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockClient);
      prismaService.project.findMany.mockResolvedValue(mockProjects);
      prismaService.invoice.findMany.mockResolvedValue(mockInvoices);

      const result = await service.getClientAnalytics(mockClientId);

      expect(result.clientInfo.id).toBe(mockClientId);
      expect(result.clientInfo.email).toBe('client@test.com');
      expect(result.projectStats.total).toBe(3);
      expect(result.projectStats.active).toBe(1);
      expect(result.projectStats.completed).toBe(1);
      expect(result.projectStats.waitingPayment).toBe(1);
    });

    it('should calculate financial stats correctly', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockClient);
      prismaService.project.findMany.mockResolvedValue(mockProjects);
      prismaService.invoice.findMany.mockResolvedValue(mockInvoices);

      const result = await service.getClientAnalytics(mockClientId);

      // Total invoiced: 2000 + 3000 + 1500 = 6500
      expect(result.financialStats.totalInvoiced).toBe(6500);
      // Total paid from projects: 1000 + 3000 + 0 = 4000
      expect(result.financialStats.totalPaid).toBe(4000);
      // Pending payments: 1 (SENT invoice)
      expect(result.financialStats.pendingPayments).toBe(1);
      // Average project value: (2000 + 3000 + 1500) / 3 = 2166.67
      expect(result.financialStats.averageProjectValue).toBeCloseTo(2166.67, 1);
    });

    it('should return recent projects (max 5)', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockClient);
      prismaService.project.findMany.mockResolvedValue(mockProjects);
      prismaService.invoice.findMany.mockResolvedValue(mockInvoices);

      const result = await service.getClientAnalytics(mockClientId);

      expect(result.recentProjects.length).toBeLessThanOrEqual(5);
      expect(result.recentProjects[0]).toHaveProperty('id');
      expect(result.recentProjects[0]).toHaveProperty('name');
      expect(result.recentProjects[0]).toHaveProperty('status');
      expect(result.recentProjects[0]).toHaveProperty('filesCount');
      expect(result.recentProjects[0]).toHaveProperty('employeesCount');
    });

    it('should build timeline of events', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockClient);
      prismaService.project.findMany.mockResolvedValue(mockProjects);
      prismaService.invoice.findMany.mockResolvedValue(mockInvoices);

      const result = await service.getClientAnalytics(mockClientId);

      expect(result.timeline.length).toBeGreaterThan(0);
      expect(result.timeline.length).toBeLessThanOrEqual(10);
      expect(result.timeline[0]).toHaveProperty('date');
      expect(result.timeline[0]).toHaveProperty('event');
    });

    it('should throw NotFoundException if client not found', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getClientAnalytics(mockClientId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if user is not a client', async () => {
      prismaService.user.findUnique.mockResolvedValue({
        ...mockClient,
        role: Role.ADMIN,
      });

      await expect(service.getClientAnalytics(mockClientId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle client with no projects', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockClient);
      prismaService.project.findMany.mockResolvedValue([]);
      prismaService.invoice.findMany.mockResolvedValue([]);

      const result = await service.getClientAnalytics(mockClientId);

      expect(result.projectStats.total).toBe(0);
      expect(result.financialStats.averageProjectValue).toBe(0);
      expect(result.recentProjects).toHaveLength(0);
    });
  });

  describe('getProjectDistribution', () => {
    it('should return project distribution for charts', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockClient);
      prismaService.project.findMany.mockResolvedValue(mockProjects);
      prismaService.invoice.findMany.mockResolvedValue(mockInvoices);

      const result = await service.getProjectDistribution(mockClientId);

      expect(result.labels).toEqual([
        'Waiting Payment',
        'Active',
        'Completed',
        'Archived',
      ]);
      expect(result.data).toHaveLength(4);
      expect(result.data[0]).toBe(1); // waitingPayment
      expect(result.data[1]).toBe(1); // active
      expect(result.data[2]).toBe(1); // completed
      expect(result.data[3]).toBe(0); // archived
    });
  });

  describe('getMonthlyActivity', () => {
    it('should return monthly activity for last 12 months', async () => {
      // Mock projects with updatedAt for getMonthlyActivity
      const projectsWithUpdatedAt = [
        {
          createdAt: new Date('2024-01-15'),
          status: ProjectStatus.ACTIVE,
          updatedAt: new Date('2024-01-20'),
        },
        {
          createdAt: new Date('2023-06-01'),
          status: ProjectStatus.COMPLETED,
          updatedAt: new Date('2023-07-15'),
        },
      ];

      prismaService.project.findMany.mockResolvedValue(projectsWithUpdatedAt);

      const result = await service.getMonthlyActivity(mockClientId);

      expect(result.labels).toHaveLength(12);
      expect(result.projectsCreated).toHaveLength(12);
      expect(result.projectsCompleted).toHaveLength(12);
    });

    it('should filter projects from last 12 months', async () => {
      prismaService.project.findMany.mockResolvedValue([]);

      const result = await service.getMonthlyActivity(mockClientId);

      expect(prismaService.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            clientId: mockClientId,
            deletedAt: null,
            createdAt: {
              gte: expect.any(Date),
            },
          }),
        }),
      );
    });

    it('should count projects correctly per month', async () => {
      const now = new Date();
      const currentMonthProject = {
        createdAt: now,
        status: ProjectStatus.ACTIVE,
        updatedAt: now,
      };

      prismaService.project.findMany.mockResolvedValue([currentMonthProject]);

      const result = await service.getMonthlyActivity(mockClientId);

      // The last element in the array should be the current month
      const currentMonthCreated =
        result.projectsCreated[result.projectsCreated.length - 1];
      expect(currentMonthCreated).toBe(1);
    });
  });
});
