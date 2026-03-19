import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ProjectEmployeeService } from './project-employee.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { ProjectStatus, NotificationType, Role } from '@prisma/client';

describe('ProjectEmployeeService', () => {
  let service: ProjectEmployeeService;
  let prismaService: any;
  let notificationsService: any;

  const mockProjectId = 'project-123';
  const mockEmployeeId = 'employee-123';

  const mockProject = {
    id: mockProjectId,
    name: 'Test Project',
    status: ProjectStatus.WAITING_PAYMENT,
  };

  const mockEmployee = {
    id: mockEmployeeId,
    email: 'employee@test.com',
    role: 'EMPLOYEE',
    isActive: true,
    firstName: 'John',
    lastName: 'Employee',
  };

  const mockProjectEmployee = {
    projectId: mockProjectId,
    employeeId: mockEmployeeId,
    assignedAt: new Date(),
    employee: mockEmployee,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectEmployeeService,
        {
          provide: PrismaService,
          useValue: {
            project: {
              findUnique: jest.fn(),
            },
            user: {
              findUnique: jest.fn(),
            },
            projectEmployee: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
              findFirst: jest.fn(),
              create: jest.fn(),
              delete: jest.fn(),
            },
            $transaction: jest.fn(),
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

    service = module.get<ProjectEmployeeService>(ProjectEmployeeService);
    prismaService = module.get<PrismaService>(PrismaService);
    notificationsService = module.get<NotificationsService>(NotificationsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateEmployeeAvailability', () => {
    it('should return canAssign true for available employee', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockEmployee);
      prismaService.projectEmployee.findMany.mockResolvedValue([]);

      const result = await service.validateEmployeeAvailability(mockEmployeeId);

      expect(result.canAssign).toBe(true);
    });

    it('should throw NotFoundException if user not found', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.validateEmployeeAvailability(mockEmployeeId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if user is not an employee', async () => {
      prismaService.user.findUnique.mockResolvedValue({
        ...mockEmployee,
        role: 'CLIENT',
      });

      await expect(
        service.validateEmployeeAvailability(mockEmployeeId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if employee is not active', async () => {
      prismaService.user.findUnique.mockResolvedValue({
        ...mockEmployee,
        isActive: false,
      });

      await expect(
        service.validateEmployeeAvailability(mockEmployeeId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return canAssign false if employee has active project', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockEmployee);
      prismaService.projectEmployee.findMany.mockResolvedValue([
        {
          projectId: 'other-project',
          project: {
            id: 'other-project',
            name: 'Active Project',
            status: ProjectStatus.ACTIVE,
          },
        },
      ]);

      const result = await service.validateEmployeeAvailability(mockEmployeeId);

      expect(result.canAssign).toBe(false);
      expect(result.reason).toContain('already assigned');
      expect(result.currentProject?.name).toBe('Active Project');
    });

    it('should exclude specified project from check', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockEmployee);
      prismaService.projectEmployee.findMany.mockResolvedValue([]);

      const result = await service.validateEmployeeAvailability(
        mockEmployeeId,
        mockProjectId,
      );

      expect(result.canAssign).toBe(true);
      expect(prismaService.projectEmployee.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            project: expect.objectContaining({
              id: { not: mockProjectId },
            }),
          }),
        }),
      );
    });
  });

  describe('assignEmployeesToProject', () => {
    it('should assign employees to project', async () => {
      prismaService.project.findUnique.mockResolvedValue(mockProject);
      prismaService.user.findUnique.mockResolvedValue(mockEmployee);
      prismaService.projectEmployee.findMany.mockResolvedValue([]);
      prismaService.$transaction.mockResolvedValue([]);

      await service.assignEmployeesToProject(mockProjectId, [mockEmployeeId]);

      expect(prismaService.$transaction).toHaveBeenCalled();
      expect(notificationsService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockEmployeeId,
          type: NotificationType.INFO,
          title: 'New Project Assignment',
        }),
      );
    });

    it('should throw NotFoundException if project not found', async () => {
      prismaService.project.findUnique.mockResolvedValue(null);

      await expect(
        service.assignEmployeesToProject(mockProjectId, [mockEmployeeId]),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if employee not found during assignment', async () => {
      prismaService.project.findUnique.mockResolvedValue(mockProject);
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.assignEmployeesToProject(mockProjectId, [mockEmployeeId]),
      ).rejects.toThrow(NotFoundException);

      expect(prismaService.$transaction).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if user is not an employee during assignment', async () => {
      prismaService.project.findUnique.mockResolvedValue(mockProject);
      prismaService.user.findUnique.mockResolvedValue({
        ...mockEmployee,
        role: 'CLIENT',
      });

      await expect(
        service.assignEmployeesToProject(mockProjectId, [mockEmployeeId]),
      ).rejects.toThrow(BadRequestException);

      expect(prismaService.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('removeEmployeeFromProject', () => {
    it('should remove employee from project', async () => {
      prismaService.projectEmployee.findUnique.mockResolvedValue(mockProjectEmployee);
      prismaService.projectEmployee.delete.mockResolvedValue(mockProjectEmployee);

      await service.removeEmployeeFromProject(mockProjectId, mockEmployeeId);

      expect(prismaService.projectEmployee.delete).toHaveBeenCalledWith({
        where: {
          projectId_employeeId: {
            projectId: mockProjectId,
            employeeId: mockEmployeeId,
          },
        },
      });
    });

    it('should throw NotFoundException if assignment not found', async () => {
      prismaService.projectEmployee.findUnique.mockResolvedValue(null);

      await expect(
        service.removeEmployeeFromProject(mockProjectId, mockEmployeeId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getProjectEmployees', () => {
    it('should return all employees for project', async () => {
      prismaService.projectEmployee.findMany.mockResolvedValue([mockProjectEmployee]);

      const result = await service.getProjectEmployees(mockProjectId);

      expect(result).toHaveLength(1);
      expect(prismaService.projectEmployee.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { projectId: mockProjectId },
        }),
      );
    });
  });

  describe('getEmployeeProjects', () => {
    it('should return all projects for employee', async () => {
      prismaService.projectEmployee.findMany.mockResolvedValue([
        {
          ...mockProjectEmployee,
          project: mockProject,
        },
      ]);

      const result = await service.getEmployeeProjects(mockEmployeeId);

      expect(result).toHaveLength(1);
      expect(prismaService.projectEmployee.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { employeeId: mockEmployeeId },
        }),
      );
    });
  });

  describe('getEmployeeActiveProject', () => {
    it('should return active project for employee', async () => {
      const activeProject = { ...mockProject, status: ProjectStatus.ACTIVE };
      prismaService.projectEmployee.findFirst.mockResolvedValue({
        ...mockProjectEmployee,
        project: activeProject,
      });

      const result = await service.getEmployeeActiveProject(mockEmployeeId);

      expect(result).toEqual(activeProject);
    });

    it('should return null if no active project', async () => {
      prismaService.projectEmployee.findFirst.mockResolvedValue(null);

      const result = await service.getEmployeeActiveProject(mockEmployeeId);

      expect(result).toBeNull();
    });
  });

  describe('isEmployeeAvailable', () => {
    it('should return true for available employee', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockEmployee);
      prismaService.projectEmployee.findMany.mockResolvedValue([]);

      const result = await service.isEmployeeAvailable(mockEmployeeId);

      expect(result).toBe(true);
    });

    it('should return false for unavailable employee', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockEmployee);
      prismaService.projectEmployee.findMany.mockResolvedValue([
        {
          projectId: 'other-project',
          project: {
            id: 'other-project',
            name: 'Active Project',
            status: ProjectStatus.ACTIVE,
          },
        },
      ]);

      const result = await service.isEmployeeAvailable(mockEmployeeId);

      expect(result).toBe(false);
    });
  });
});
