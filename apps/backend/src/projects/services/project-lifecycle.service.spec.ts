import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ProjectLifecycleService } from './project-lifecycle.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheManagerService } from '../../cache/services/cache-manager.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { Role, NotificationType } from '@prisma/client';

// Mock the transaction helper
jest.mock('../../common/helpers/transaction.helpers', () => ({
  executeTransactionWithRetry: jest.fn().mockImplementation(
    async (prisma, callback) => callback(prisma),
  ),
}));

describe('ProjectLifecycleService', () => {
  let service: ProjectLifecycleService;
  let prismaService: any;
  let cacheManager: any;
  let notificationsService: any;

  const mockProjectId = 'project-123';
  const mockAdminId = 'admin-123';
  const mockClientId = 'client-123';
  const mockEmployeeId = 'employee-123';

  const mockProject = {
    id: mockProjectId,
    name: 'Test Project',
    clientId: mockClientId,
    deletedAt: null,
    client: { id: mockClientId },
    employees: [
      { employee: { id: mockEmployeeId } },
    ],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectLifecycleService,
        {
          provide: PrismaService,
          useValue: {
            project: {
              findFirst: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            file: {
              count: jest.fn(),
              updateMany: jest.fn(),
            },
            feedbackCycle: {
              count: jest.fn(),
              updateMany: jest.fn(),
            },
            projectEmployee: {
              count: jest.fn(),
            },
            invoice: {
              count: jest.fn(),
            },
            payment: {
              count: jest.fn(),
            },
            user: {
              findUnique: jest.fn(),
            },
          },
        },
        {
          provide: CacheManagerService,
          useValue: {
            invalidateProjectCaches: jest.fn(),
          },
        },
        {
          provide: NotificationsService,
          useValue: {
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ProjectLifecycleService>(ProjectLifecycleService);
    prismaService = module.get<PrismaService>(PrismaService);
    cacheManager = module.get<CacheManagerService>(CacheManagerService);
    notificationsService = module.get<NotificationsService>(NotificationsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('softDelete', () => {
    it('should soft delete project for admin', async () => {
      prismaService.project.findFirst.mockResolvedValue(mockProject);
      prismaService.project.findUnique.mockResolvedValue(mockProject);

      const result = await service.softDelete(mockProjectId, mockAdminId, Role.ADMIN);

      expect(result.message).toContain('deleted');
      expect(cacheManager.invalidateProjectCaches).toHaveBeenCalledWith(mockProjectId);
    });

    it('should throw NotFoundException if project not found', async () => {
      prismaService.project.findFirst.mockResolvedValue(null);

      await expect(
        service.softDelete(mockProjectId, mockAdminId, Role.ADMIN),
      ).rejects.toThrow(NotFoundException);
    });

    it('should send notifications to client and employees', async () => {
      prismaService.project.findFirst.mockResolvedValue(mockProject);
      prismaService.project.findUnique.mockResolvedValue(mockProject);

      await service.softDelete(mockProjectId, mockAdminId, Role.ADMIN);

      // Should notify client
      expect(notificationsService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockClientId,
          type: NotificationType.WARNING,
          title: 'Project Deleted',
        }),
      );

      // Should notify employees
      expect(notificationsService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockEmployeeId,
          type: NotificationType.WARNING,
          title: 'Project Deleted',
        }),
      );
    });
  });

  describe('checkDeletionSafety', () => {
    it('should return safety info with counts', async () => {
      prismaService.project.findUnique.mockResolvedValue(mockProject);
      prismaService.file.count.mockResolvedValue(5);
      prismaService.projectEmployee.count.mockResolvedValue(2);
      prismaService.invoice.count.mockResolvedValue(1);
      prismaService.payment.count.mockResolvedValue(3);
      prismaService.feedbackCycle.count.mockResolvedValue(1);
      prismaService.user.findUnique.mockResolvedValue({
        id: mockClientId,
        firstName: 'John',
        lastName: 'Doe',
      });

      const result = await service.checkDeletionSafety(mockProjectId);

      expect(result.projectId).toBe(mockProjectId);
      expect(result.projectName).toBe('Test Project');
      expect(result.hasData).toBe(true);
      expect(result.counts.files).toBe(5);
      expect(result.counts.employees).toBe(2);
      expect(result.counts.invoices).toBe(1);
      expect(result.counts.payments).toBe(3);
      expect(result.counts.feedbackCycles).toBe(1);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.client).toEqual({
        id: mockClientId,
        name: 'John Doe',
      });
    });

    it('should return hasData false when project is empty', async () => {
      prismaService.project.findUnique.mockResolvedValue(mockProject);
      prismaService.file.count.mockResolvedValue(0);
      prismaService.projectEmployee.count.mockResolvedValue(0);
      prismaService.invoice.count.mockResolvedValue(0);
      prismaService.payment.count.mockResolvedValue(0);
      prismaService.feedbackCycle.count.mockResolvedValue(0);
      prismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.checkDeletionSafety(mockProjectId);

      expect(result.hasData).toBe(false);
      expect(result.warnings.length).toBe(0);
    });

    it('should throw NotFoundException if project not found', async () => {
      prismaService.project.findUnique.mockResolvedValue(null);

      await expect(
        service.checkDeletionSafety(mockProjectId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should build proper warning messages', async () => {
      prismaService.project.findUnique.mockResolvedValue(mockProject);
      prismaService.file.count.mockResolvedValue(1);
      prismaService.projectEmployee.count.mockResolvedValue(1);
      prismaService.invoice.count.mockResolvedValue(0);
      prismaService.payment.count.mockResolvedValue(0);
      prismaService.feedbackCycle.count.mockResolvedValue(0);
      prismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.checkDeletionSafety(mockProjectId);

      expect(result.warnings).toContain('1 uploaded file');
      expect(result.warnings).toContain('1 assigned employee');
    });

    it('should use plural for multiple items', async () => {
      prismaService.project.findUnique.mockResolvedValue(mockProject);
      prismaService.file.count.mockResolvedValue(5);
      prismaService.projectEmployee.count.mockResolvedValue(0);
      prismaService.invoice.count.mockResolvedValue(0);
      prismaService.payment.count.mockResolvedValue(0);
      prismaService.feedbackCycle.count.mockResolvedValue(0);
      prismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.checkDeletionSafety(mockProjectId);

      expect(result.warnings).toContain('5 uploaded files');
    });
  });
});
