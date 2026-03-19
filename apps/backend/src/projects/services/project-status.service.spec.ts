import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ProjectStatusService } from './project-status.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { ProjectStatus, NotificationType } from '@prisma/client';
import { Prisma } from '@prisma/client';

describe('ProjectStatusService', () => {
  let service: ProjectStatusService;
  let prismaService: any;
  let notificationsService: any;

  const mockProjectId = 'project-123';
  const mockClientId = 'client-123';
  const mockEmployeeId = 'employee-123';

  const mockProject = {
    id: mockProjectId,
    name: 'Test Project',
    status: ProjectStatus.WAITING_PAYMENT,
    initialAmountRequired: new Prisma.Decimal(1000),
    amountPaid: new Prisma.Decimal(1000),
    briefApprovedAt: new Date(),
    startDate: null,
    deadlineDate: null,
    archivedAt: null,
    client: {
      id: mockClientId,
      email: 'client@test.com',
      firstName: 'John',
      lastName: 'Client',
    },
    employees: [
      {
        employee: {
          id: mockEmployeeId,
          email: 'emp@test.com',
          firstName: 'Jane',
          lastName: 'Employee',
        },
      },
    ],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectStatusService,
        {
          provide: PrismaService,
          useValue: {
            project: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            projectEmployee: {
              count: jest.fn(),
            },
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

    service = module.get<ProjectStatusService>(ProjectStatusService);
    prismaService = module.get<PrismaService>(PrismaService);
    notificationsService =
      module.get<NotificationsService>(NotificationsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('canActivateProject', () => {
    it('should return canActivate true when all requirements met', async () => {
      prismaService.project.findUnique.mockResolvedValue(mockProject);
      prismaService.projectEmployee.count.mockResolvedValue(1);

      const result = await service.canActivateProject(mockProjectId);

      expect(result.canActivate).toBe(true);
      expect(result.paymentProgress).toEqual({
        required: 1000,
        paid: 1000,
        remaining: 0,
      });
    });

    it('should return false when no employees assigned', async () => {
      prismaService.project.findUnique.mockResolvedValue(mockProject);
      prismaService.projectEmployee.count.mockResolvedValue(0);

      const result = await service.canActivateProject(mockProjectId);

      expect(result.canActivate).toBe(false);
      expect(result.missingRequirements).toEqual(
        expect.arrayContaining([
          expect.stringContaining('No employee assigned'),
        ]),
      );
    });

    it('should return false when brief not approved', async () => {
      prismaService.project.findUnique.mockResolvedValue({
        ...mockProject,
        briefApprovedAt: null,
      });
      prismaService.projectEmployee.count.mockResolvedValue(1);

      const result = await service.canActivateProject(mockProjectId);

      expect(result.canActivate).toBe(false);
      expect(result.missingRequirements).toEqual(
        expect.arrayContaining([
          expect.stringContaining('Project Brief not closed'),
        ]),
      );
    });

    it('should return false when payment amount not configured', async () => {
      prismaService.project.findUnique.mockResolvedValue({
        ...mockProject,
        initialAmountRequired: null,
      });
      prismaService.projectEmployee.count.mockResolvedValue(1);

      const result = await service.canActivateProject(mockProjectId);

      expect(result.canActivate).toBe(false);
      expect(result.missingRequirements).toEqual(
        expect.arrayContaining([
          expect.stringContaining('Payment amount not configured'),
        ]),
      );
    });

    it('should return false when payment not complete', async () => {
      prismaService.project.findUnique.mockResolvedValue({
        ...mockProject,
        amountPaid: new Prisma.Decimal(500),
      });
      prismaService.projectEmployee.count.mockResolvedValue(1);

      const result = await service.canActivateProject(mockProjectId);

      expect(result.canActivate).toBe(false);
      expect(result.paymentProgress).toEqual({
        required: 1000,
        paid: 500,
        remaining: 500,
      });
    });

    it('should return false when project is not in WAITING_PAYMENT status', async () => {
      prismaService.project.findUnique.mockResolvedValue({
        ...mockProject,
        status: ProjectStatus.ACTIVE,
      });

      const result = await service.canActivateProject(mockProjectId);

      expect(result.canActivate).toBe(false);
      expect(result.reason).toContain('already ACTIVE');
    });

    it('should throw BadRequestException if project not found', async () => {
      prismaService.project.findUnique.mockResolvedValue(null);

      await expect(service.canActivateProject(mockProjectId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('activateProject', () => {
    it('should activate project when requirements met', async () => {
      prismaService.project.findUnique.mockResolvedValue(mockProject);
      prismaService.projectEmployee.count.mockResolvedValue(1);
      const activatedProject = {
        ...mockProject,
        status: ProjectStatus.ACTIVE,
        startDate: new Date(),
      };
      prismaService.project.update.mockResolvedValue(activatedProject);

      const result = await service.activateProject(mockProjectId);

      expect(result.status).toBe(ProjectStatus.ACTIVE);
      expect(prismaService.project.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: ProjectStatus.ACTIVE,
          }),
        }),
      );
      // Should notify client
      expect(notificationsService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockClientId,
          type: NotificationType.SUCCESS,
          title: 'Project Activated',
        }),
      );
      // Should notify employees
      expect(notificationsService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockEmployeeId,
          type: NotificationType.INFO,
          title: 'Project Activated',
        }),
      );
    });

    it('should throw BadRequestException when requirements not met', async () => {
      prismaService.project.findUnique.mockResolvedValue(mockProject);
      prismaService.projectEmployee.count.mockResolvedValue(0);

      await expect(service.activateProject(mockProjectId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('completeProject', () => {
    it('should complete active project', async () => {
      const activeProject = { ...mockProject, status: ProjectStatus.ACTIVE };
      prismaService.project.findUnique.mockResolvedValue(activeProject);
      const completedProject = {
        ...activeProject,
        status: ProjectStatus.COMPLETED,
      };
      prismaService.project.update.mockResolvedValue(completedProject);

      const result = await service.completeProject(mockProjectId);

      expect(result.status).toBe(ProjectStatus.COMPLETED);
      expect(notificationsService.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException if project not active', async () => {
      prismaService.project.findUnique.mockResolvedValue(mockProject);

      await expect(service.completeProject(mockProjectId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if project not found', async () => {
      prismaService.project.findUnique.mockResolvedValue(null);

      await expect(service.completeProject(mockProjectId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('archiveProject', () => {
    it('should archive completed project', async () => {
      const completedProject = {
        ...mockProject,
        status: ProjectStatus.COMPLETED,
      };
      prismaService.project.findUnique.mockResolvedValue(completedProject);
      const archivedProject = {
        ...completedProject,
        status: ProjectStatus.ARCHIVED,
        archivedAt: new Date(),
      };
      prismaService.project.update.mockResolvedValue(archivedProject);

      const result = await service.archiveProject(mockProjectId);

      expect(result.status).toBe(ProjectStatus.ARCHIVED);
      expect(result.archivedAt).toBeDefined();
    });

    it('should throw BadRequestException if project not completed', async () => {
      prismaService.project.findUnique.mockResolvedValue(mockProject);

      await expect(service.archiveProject(mockProjectId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('updateProjectPayment', () => {
    it('should update payment and return result', async () => {
      prismaService.project.findUnique.mockResolvedValue({
        ...mockProject,
        amountPaid: new Prisma.Decimal(500),
      });
      const updatedProject = {
        ...mockProject,
        amountPaid: new Prisma.Decimal(1000),
      };
      prismaService.project.update.mockResolvedValue(updatedProject);
      prismaService.projectEmployee.count.mockResolvedValue(1);

      const result = await service.updateProjectPayment(mockProjectId, 500);

      expect(prismaService.project.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { amountPaid: 1000 },
        }),
      );
    });

    it('should auto-activate if payment completes requirements', async () => {
      // Initial findUnique for updateProjectPayment
      const projectWithPartialPayment = {
        ...mockProject,
        amountPaid: new Prisma.Decimal(500),
      };

      const updatedProject = {
        ...mockProject,
        amountPaid: new Prisma.Decimal(1000),
      };

      const activatedProject = {
        ...updatedProject,
        status: ProjectStatus.ACTIVE,
        startDate: new Date(),
      };

      // Mock findUnique calls in sequence:
      // 1. updateProjectPayment initial check
      // 2. canActivateProject check
      // 3. activateProject check
      prismaService.project.findUnique
        .mockResolvedValueOnce(projectWithPartialPayment) // updateProjectPayment
        .mockResolvedValueOnce(updatedProject) // canActivateProject
        .mockResolvedValueOnce(updatedProject); // activateProject

      // Mock update calls:
      // 1. Update amountPaid
      // 2. Activate project
      prismaService.project.update
        .mockResolvedValueOnce(updatedProject)
        .mockResolvedValueOnce(activatedProject);

      prismaService.projectEmployee.count.mockResolvedValue(1);

      const result = await service.updateProjectPayment(mockProjectId, 500);

      expect(result.activated).toBe(true);
    });

    it('should throw BadRequestException if project not found', async () => {
      prismaService.project.findUnique.mockResolvedValue(null);

      await expect(
        service.updateProjectPayment(mockProjectId, 500),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getProjectStatusSummary', () => {
    it('should return project status summary', async () => {
      const projectWithCount = {
        ...mockProject,
        _count: {
          files: 10,
          feedbackCycles: 3,
        },
      };
      prismaService.project.findUnique.mockResolvedValue(projectWithCount);
      prismaService.projectEmployee.count.mockResolvedValue(1);

      const result = await service.getProjectStatusSummary(mockProjectId);

      expect(result.id).toBe(mockProjectId);
      expect(result.name).toBe('Test Project');
      expect(result.status).toBe(ProjectStatus.WAITING_PAYMENT);
      expect(result.fileCount).toBe(10);
      expect(result.feedbackCycleCount).toBe(3);
      expect(result.employeeCount).toBe(1);
      expect(result.paymentProgress).toEqual({
        required: 1000,
        paid: 1000,
        remaining: 0,
        percentage: 100,
      });
    });

    it('should throw BadRequestException if project not found', async () => {
      prismaService.project.findUnique.mockResolvedValue(null);

      await expect(
        service.getProjectStatusSummary(mockProjectId),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
