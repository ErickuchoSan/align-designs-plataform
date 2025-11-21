import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { Role } from '@prisma/client';

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
    client: mockUser,
    creator: { ...mockUser, role: Role.ADMIN },
    files: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findFirst: jest.fn(),
            },
            project: {
              create: jest.fn(),
              findFirst: jest.fn(),
              findMany: jest.fn(),
              update: jest.fn(),
              count: jest.fn(),
            },
            file: {
              count: jest.fn(),
              updateMany: jest.fn(),
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
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
    prismaService = module.get<PrismaService>(PrismaService);
    storageService = module.get<StorageService>(StorageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create project successfully for admin', async () => {
      jest.spyOn(prismaService.user, 'findFirst').mockResolvedValue(mockUser);
      jest.spyOn(prismaService.project, 'create').mockResolvedValue(mockProject);

      const result = await service.create(
        {
          name: 'Test Project',
          description: 'Test Description',
          clientId: 'client-123',
        },
        'admin-123',
        Role.ADMIN,
      );

      expect(result).toBeDefined();
      expect(result.name).toBe('Test Project');
      expect(prismaService.project.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if client does not exist', async () => {
      jest.spyOn(prismaService.user, 'findFirst').mockResolvedValue(null);

      await expect(
        service.create(
          {
            name: 'Test Project',
            description: 'Test Description',
            clientId: 'non-existent',
          },
          'admin-123',
          Role.ADMIN,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if client is not a CLIENT role', async () => {
      const adminUser = { ...mockUser, role: Role.ADMIN };
      jest.spyOn(prismaService.user, 'findFirst').mockResolvedValue(adminUser);

      await expect(
        service.create(
          {
            name: 'Test Project',
            description: 'Test Description',
            clientId: 'admin-123',
          },
          'admin-123',
          Role.ADMIN,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if client is deleted', async () => {
      const deletedUser = { ...mockUser, deletedAt: new Date() };
      jest.spyOn(prismaService.user, 'findFirst').mockResolvedValue(null); // findFirst with deletedAt filter returns null

      await expect(
        service.create(
          {
            name: 'Test Project',
            description: 'Test Description',
            clientId: 'client-123',
          },
          'admin-123',
          Role.ADMIN,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOne', () => {
    it('should return project for admin', async () => {
      jest.spyOn(prismaService.project, 'findFirst').mockResolvedValue(mockProject);

      const result = await service.findOne('project-123', 'admin-123', Role.ADMIN);

      expect(result).toBeDefined();
      expect(result.id).toBe('project-123');
    });

    it('should return project for project client', async () => {
      jest.spyOn(prismaService.project, 'findFirst').mockResolvedValue(mockProject);

      const result = await service.findOne('project-123', 'client-123', Role.CLIENT);

      expect(result).toBeDefined();
    });

    it('should throw NotFoundException for non-existent project', async () => {
      jest.spyOn(prismaService.project, 'findFirst').mockResolvedValue(null);

      await expect(
        service.findOne('non-existent', 'admin-123', Role.ADMIN),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for client accessing other project', async () => {
      jest.spyOn(prismaService.project, 'findFirst').mockResolvedValue(mockProject);

      await expect(
        service.findOne('project-123', 'different-client', Role.CLIENT),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should separate files and comments count correctly', async () => {
      const projectWithFiles = {
        ...mockProject,
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

      const result = await service.findOne('project-123', 'admin-123', Role.ADMIN);

      expect(result._count.files).toBe(2); // Files with actual files
      expect(result._count.comments).toBe(1); // Comments without files
    });
  });

  describe('update', () => {
    it('should update project successfully for admin', async () => {
      jest.spyOn(prismaService.project, 'findFirst').mockResolvedValue(mockProject);
      const updatedProject = { ...mockProject, name: 'Updated Name' };
      jest.spyOn(prismaService.project, 'update').mockResolvedValue(updatedProject);

      const result = await service.update(
        'project-123',
        { name: 'Updated Name' },
        'admin-123',
        Role.ADMIN,
      );

      expect(result.name).toBe('Updated Name');
    });

    it('should throw ForbiddenException for client updating other project', async () => {
      jest.spyOn(prismaService.project, 'findFirst').mockResolvedValue(mockProject);

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
      jest.spyOn(prismaService.project, 'findFirst').mockResolvedValue(mockProject);
      jest.spyOn(prismaService.user, 'findFirst').mockResolvedValue(mockUser);
      jest.spyOn(prismaService.file, 'count').mockResolvedValue(0);
      const updatedProject = {
        ...mockProject,
        clientId: 'new-client-123',
        files: [],
      };
      jest.spyOn(prismaService.project, 'update').mockResolvedValue(updatedProject as any);

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
        files: [
          { id: '1', uploadedBy: 'client-123' },
          { id: '2', uploadedBy: 'client-123' },
        ],
      };
      jest.spyOn(prismaService.project, 'findFirst').mockResolvedValue(projectWithFiles as any);
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
      jest.spyOn(prismaService.project, 'findFirst').mockResolvedValue(mockProject);
      jest.spyOn(prismaService.$transaction, 'mockImplementation' as any).mockImplementation(
        async (callback: any) => {
          return callback({
            project: {
              update: jest.fn().mockResolvedValue({
                ...mockProject,
                deletedAt: new Date(),
              }),
            },
            file: {
              updateMany: jest.fn(),
            },
          });
        },
      );

      const result = await service.remove('project-123', 'admin-123', Role.ADMIN);

      expect(result.message).toContain('deleted');
    });

    it('should throw ForbiddenException for client deleting other project', async () => {
      jest.spyOn(prismaService.project, 'findFirst').mockResolvedValue(mockProject);

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

      jest.spyOn(prismaService.project, 'findFirst').mockResolvedValue(
        projectWithFiles as any,
      );

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

      await service.remove('project-123', 'admin-123', Role.ADMIN);

      expect(mockTx.file.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { projectId: 'project-123', deletedAt: null },
        }),
      );
    });
  });

  describe('findAll', () => {
    it('should return all projects for admin', async () => {
      const mockProjects = [mockProject];
      jest.spyOn(prismaService.project, 'findMany').mockResolvedValue(mockProjects);
      jest.spyOn(prismaService.project, 'count').mockResolvedValue(1);

      const result = await service.findAll(
        'admin-123',
        Role.ADMIN,
        { page: 1, limit: 10 },
      );

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('should return only client projects for CLIENT role', async () => {
      const clientProjects = [mockProject];
      jest.spyOn(prismaService.project, 'findMany').mockResolvedValue(clientProjects);
      jest.spyOn(prismaService.project, 'count').mockResolvedValue(1);

      const result = await service.findAll(
        'client-123',
        Role.CLIENT,
        { page: 1, limit: 10 },
      );

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
      jest.spyOn(prismaService.project, 'findMany').mockResolvedValue([mockProject]);
      jest.spyOn(prismaService.project, 'count').mockResolvedValue(25);

      const result = await service.findAll(
        'admin-123',
        Role.ADMIN,
        { page: 2, limit: 10 },
      );

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
