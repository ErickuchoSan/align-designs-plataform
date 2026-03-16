// Mock uuid before any imports that transitively use it
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-1234'),
}));

import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Role, ProjectStatus, Prisma } from '@prisma/client';
import { ProjectsService } from './projects.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { CacheManagerService } from '../cache/services/cache-manager.service';
import { ProjectEmployeeService } from './services/project-employee.service';
import { ProjectStatusService } from './services/project-status.service';
import { InvoicesService } from '../invoices/invoices.service';
import { NotificationsService } from '../notifications/notifications.service';
import { INJECTION_TOKENS } from '../common/constants/injection-tokens';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let prismaService: PrismaService;
  let storageService: StorageService;

  const mockUser = {
    id: 'user-123',
    email: 'user@test.com',
    firstName: 'Test',
    lastName: 'User',
    phone: null,
    passwordHash: 'hashed',
    role: Role.CLIENT,
    isActive: true,
    emailVerified: true,
    failedLoginAttempts: 0,
    accountLockedUntil: null,
    lastFailedLoginAt: null,
    deletedAt: null,
    deletedBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockProject = {
    id: 'project-123',
    name: 'Test Project',
    description: 'Test Description',
    clientId: 'client-123',
    createdBy: 'admin-123',
    deletedAt: null,
    deletedBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    status: ProjectStatus.WAITING_PAYMENT,
    initialAmountRequired: null,
    amountPaid: new Prisma.Decimal(0),
    startDate: null,
    deadlineDate: null,
    initialPaymentDeadline: null,
    archivedAt: null,
    briefApprovedAt: null,
    client: mockUser,
    creator: { ...mockUser, role: Role.ADMIN },
    files: [],
  };

  const mockProjectRepository = {
    create: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockUserRepository = {
    findById: jest.fn(),
    findByEmail: jest.fn(),
  };

  const mockCacheManagerService = {
    get: jest.fn(),
    set: jest.fn(),
    invalidateProjectCaches: jest.fn(),
  };

  const mockProjectEmployeeService = {
    validateEmployeeAvailability: jest.fn(),
    assignEmployeesToProject: jest.fn(),
    removeEmployeeFromProject: jest.fn(),
  };

  const mockProjectStatusService = {
    updateStatus: jest.fn(),
  };

  const mockInvoicesService = {
    createInvoiceForProject: jest.fn(),
  };

  const mockNotificationsService = {
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        {
          provide: INJECTION_TOKENS.PROJECT_REPOSITORY,
          useValue: mockProjectRepository,
        },
        {
          provide: INJECTION_TOKENS.USER_REPOSITORY,
          useValue: mockUserRepository,
        },
        {
          provide: PrismaService,
          useValue: {
            user: {
              findFirst: jest.fn(),
              findUnique: jest.fn(),
            },
            project: {
              create: jest.fn(),
              findFirst: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              count: jest.fn(),
            },
            file: {
              count: jest.fn(),
              updateMany: jest.fn(),
              groupBy: jest.fn(),
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
            employeePayment: {
              count: jest.fn(),
            },
            $transaction: jest.fn(),
          },
        },
        {
          provide: StorageService,
          useValue: {
            deleteFile: jest.fn(),
          },
        },
        {
          provide: CacheManagerService,
          useValue: mockCacheManagerService,
        },
        {
          provide: ProjectEmployeeService,
          useValue: mockProjectEmployeeService,
        },
        {
          provide: ProjectStatusService,
          useValue: mockProjectStatusService,
        },
        {
          provide: InvoicesService,
          useValue: mockInvoicesService,
        },
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
    prismaService = module.get<PrismaService>(PrismaService);
    storageService = module.get<StorageService>(StorageService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create project successfully for admin', async () => {
      // Mock userRepo.findById to return a valid client
      mockUserRepository.findById.mockResolvedValue(mockUser);
      // Mock projectRepo.create to return the project
      mockProjectRepository.create.mockResolvedValue(mockProject);
      // Mock prisma.project.findFirst for fetching with relations
      jest.spyOn(prismaService.project, 'findFirst').mockResolvedValue({
        ...mockProject,
        employees: [] as any,
      } as any);

      const result = await service.create(
        {
          name: 'Test Project',
          description: 'Test Description',
          clientId: 'client-123',
        },
        'admin-123',
      );

      expect(result).toBeDefined();
      expect(result.name).toBe('Test Project');
      expect(mockProjectRepository.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if client does not exist', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(
        service.create(
          {
            name: 'Test Project',
            description: 'Test Description',
            clientId: 'non-existent',
          },
          'admin-123',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if client is not a CLIENT role', async () => {
      const adminUser = { ...mockUser, role: Role.ADMIN };
      mockUserRepository.findById.mockResolvedValue(adminUser);

      await expect(
        service.create(
          {
            name: 'Test Project',
            description: 'Test Description',
            clientId: 'admin-123',
          },
          'admin-123',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if client is deleted', async () => {
      // userRepo.findById returns null for deleted users
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(
        service.create(
          {
            name: 'Test Project',
            description: 'Test Description',
            clientId: 'client-123',
          },
          'admin-123',
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOne', () => {
    const mockProjectWithEmployees = {
      ...mockProject,
      employees: [],
    };

    it('should return project for admin', async () => {
      jest
        .spyOn(prismaService.project, 'findFirst')
        .mockResolvedValue(mockProjectWithEmployees);

      const result = await service.findOne(
        'project-123',
        'admin-123',
        Role.ADMIN,
      );

      expect(result).toBeDefined();
      expect(result.id).toBe('project-123');
    });

    it('should return project for project client', async () => {
      jest
        .spyOn(prismaService.project, 'findFirst')
        .mockResolvedValue(mockProjectWithEmployees);

      const result = await service.findOne(
        'project-123',
        'client-123',
        Role.CLIENT,
      );

      expect(result).toBeDefined();
    });

    it('should throw NotFoundException for non-existent project', async () => {
      jest.spyOn(prismaService.project, 'findFirst').mockResolvedValue(null);

      await expect(
        service.findOne('non-existent', 'admin-123', Role.ADMIN),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for client accessing other project', async () => {
      jest
        .spyOn(prismaService.project, 'findFirst')
        .mockResolvedValue(mockProjectWithEmployees);

      await expect(
        service.findOne('project-123', 'different-client', Role.CLIENT),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should separate files and comments count correctly', async () => {
      const projectWithFiles = {
        ...mockProject,
        employees: [],
        files: [
          {
            id: '1',
            filename: 'file1.pdf',
            storagePath: '/path',
            comment: 'comment',
          },
          {
            id: '2',
            filename: null,
            storagePath: null,
            comment: 'just comment',
          },
          {
            id: '3',
            filename: 'file2.pdf',
            storagePath: '/path2',
            comment: null,
          },
        ],
      };

      jest
        .spyOn(prismaService.project, 'findFirst')
        .mockResolvedValue(projectWithFiles as any);

      const result = await service.findOne(
        'project-123',
        'admin-123',
        Role.ADMIN,
      );

      expect(result._count.files).toBe(2); // Files with actual files
      expect(result._count.comments).toBe(1); // Comments without files
    });
  });

  describe('update', () => {
    const mockProjectWithEmployees = {
      ...mockProject,
      employees: [],
    };

    it('should update project successfully for admin', async () => {
      jest
        .spyOn(prismaService.project, 'findFirst')
        .mockResolvedValue(mockProjectWithEmployees);
      const updatedProject = { ...mockProjectWithEmployees, name: 'Updated Name' };
      jest
        .spyOn(prismaService.project, 'update')
        .mockResolvedValue(updatedProject);

      const result = await service.update(
        'project-123',
        { name: 'Updated Name' },
        'admin-123',
        Role.ADMIN,
      );

      expect(result.name).toBe('Updated Name');
    });

    it('should throw ForbiddenException for client updating other project', async () => {
      jest
        .spyOn(prismaService.project, 'findFirst')
        .mockResolvedValue(mockProjectWithEmployees);

      await expect(
        service.update(
          'project-123',
          { name: 'Updated' },
          'different-client',
          Role.CLIENT,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should validate new client when changing clientId', async () => {
      jest
        .spyOn(prismaService.project, 'findFirst')
        .mockResolvedValue(mockProjectWithEmployees);
      jest.spyOn(prismaService.user, 'findFirst').mockResolvedValue(mockUser);
      jest.spyOn(prismaService.file, 'count').mockResolvedValue(0);
      const updatedProject = {
        ...mockProjectWithEmployees,
        clientId: 'new-client-123',
      };
      jest
        .spyOn(prismaService.project, 'update')
        .mockResolvedValue(updatedProject as any);

      await service.update(
        'project-123',
        { clientId: 'new-client-123' },
        'admin-123',
        Role.ADMIN,
      );

      expect(prismaService.user.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: 'new-client-123' }),
        }),
      );
    });

    it('should prevent changing clientId if files exist', async () => {
      const projectWithFiles = {
        ...mockProject,
        employees: [],
        files: [
          { id: '1', uploadedBy: 'client-123' },
          { id: '2', uploadedBy: 'client-123' },
        ],
      };
      jest
        .spyOn(prismaService.project, 'findFirst')
        .mockResolvedValue(projectWithFiles as any);
      jest.spyOn(prismaService.user, 'findFirst').mockResolvedValue(mockUser);

      await expect(
        service.update(
          'project-123',
          { clientId: 'new-client' },
          'admin-123',
          Role.ADMIN,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should soft delete project for admin', async () => {
      jest
        .spyOn(prismaService.project, 'findFirst')
        .mockResolvedValue(mockProject);

      const mockTx = {
        project: {
          update: jest.fn().mockResolvedValue({
            ...mockProject,
            deletedAt: new Date(),
          }),
        },
        file: {
          updateMany: jest.fn(),
        },
      };

      jest
        .spyOn(prismaService, '$transaction')
        .mockImplementation(async (callback: any) => callback(mockTx));

      // Mock findUnique for post-delete notifications
      jest
        .spyOn(prismaService.project, 'findUnique')
        .mockResolvedValue({
          ...mockProject,
          employees: [],
        } as any);

      const result = await service.remove(
        'project-123',
        'admin-123',
        Role.ADMIN,
      );

      expect(result.message).toContain('deleted');
    });

    it('should throw ForbiddenException for client deleting other project', async () => {
      jest
        .spyOn(prismaService.project, 'findFirst')
        .mockResolvedValue(mockProject);

      await expect(
        service.remove('project-123', 'different-client', Role.CLIENT),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should soft delete all project files when deleting project', async () => {
      const projectWithFiles = {
        ...mockProject,
        files: [
          { id: '1', filename: 'file1.pdf', storagePath: '/path1' },
          { id: '2', filename: 'file2.pdf', storagePath: '/path2' },
        ],
      };

      jest
        .spyOn(prismaService.project, 'findFirst')
        .mockResolvedValue(projectWithFiles as any);

      const mockTx = {
        project: {
          update: jest.fn().mockResolvedValue({
            ...projectWithFiles,
            deletedAt: new Date(),
          }),
        },
        file: {
          updateMany: jest.fn(),
        },
      };

      jest
        .spyOn(prismaService, '$transaction')
        .mockImplementation(async (callback: any) => callback(mockTx));

      // Mock findUnique for post-delete notifications
      jest
        .spyOn(prismaService.project, 'findUnique')
        .mockResolvedValue({
          ...projectWithFiles,
          employees: [],
        } as any);

      await service.remove('project-123', 'admin-123', Role.ADMIN);

      expect(mockTx.file.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { projectId: 'project-123', deletedAt: null },
        }),
      );
    });
  });

  describe('findAll', () => {
    const mockProjectWithFilesAndEmployees = {
      ...mockProject,
      files: [],
      employees: [],
    };

    it('should return all projects for admin', async () => {
      const mockProjects = [mockProjectWithFilesAndEmployees];
      jest
        .spyOn(prismaService.project, 'findMany')
        .mockResolvedValue(mockProjects);
      jest.spyOn(prismaService.project, 'count').mockResolvedValue(1);

      const result = await service.findAll('admin-123', Role.ADMIN, {
        page: 1,
        limit: 10,
      });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('should return only client projects for CLIENT role', async () => {
      const clientProjects = [mockProjectWithFilesAndEmployees];
      jest
        .spyOn(prismaService.project, 'findMany')
        .mockResolvedValue(clientProjects);
      jest.spyOn(prismaService.project, 'count').mockResolvedValue(1);

      const result = await service.findAll('client-123', Role.CLIENT, {
        page: 1,
        limit: 10,
      });

      expect(result.data).toHaveLength(1);
      // Check that count was called with where clause including clientId
      expect(prismaService.project.count).toHaveBeenCalledWith({
        where: expect.objectContaining({
          deletedAt: null,
          clientId: 'client-123',
        }),
      });
    });

    it('should handle pagination correctly', async () => {
      jest
        .spyOn(prismaService.project, 'findMany')
        .mockResolvedValue([mockProjectWithFilesAndEmployees]);
      jest.spyOn(prismaService.project, 'count').mockResolvedValue(25);

      const result = await service.findAll('admin-123', Role.ADMIN, {
        page: 2,
        limit: 10,
      });

      expect(result.meta.page).toBe(2);
      expect(result.meta.limit).toBe(10);
      expect(result.meta.total).toBe(25);
      expect(result.meta.totalPages).toBe(3);
      // Verify skip was calculated correctly
      expect(prismaService.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10, // (page 2 - 1) * 10
          take: 10,
        }),
      );
    });
  });
});
