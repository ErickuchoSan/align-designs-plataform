import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { FilesService } from './files.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { Role } from '@prisma/client';

describe('FilesService', () => {
  let service: FilesService;
  let prismaService: PrismaService;
  let storageService: StorageService;

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
    client: {
      id: 'client-123',
      email: 'client@test.com',
      firstName: 'Test',
      lastName: 'Client',
      role: Role.CLIENT,
    },
  };

  const mockFile: Express.Multer.File = {
    buffer: Buffer.from('test content'),
    originalname: 'test.pdf',
    mimetype: 'application/pdf',
    size: 1024,
    fieldname: 'file',
    encoding: '7bit',
    stream: null as any,
    destination: '',
    filename: '',
    path: '',
  };

  const mockFileRecord = {
    id: 'file-123',
    projectId: 'project-123',
    uploadedBy: 'client-123',
    filename: 'test.pdf',
    originalName: 'test.pdf',
    mimeType: 'application/pdf',
    sizeBytes: BigInt(1024),
    storagePath: 'projects/project-123/test.pdf',
    comment: 'Test comment',
    deletedAt: null,
    deletedBy: null,
    uploadedAt: new Date(),
    updatedAt: new Date(),
    project: mockProject,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FilesService,
        {
          provide: PrismaService,
          useValue: {
            project: {
              findFirst: jest.fn(),
            },
            file: {
              create: jest.fn(),
              findFirst: jest.fn(),
              findMany: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
              count: jest.fn(),
            },
          },
        },
        {
          provide: StorageService,
          useValue: {
            uploadFile: jest.fn(),
            deleteFile: jest.fn(),
            getFileUrl: jest.fn(),
            getDownloadUrl: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<FilesService>(FilesService);
    prismaService = module.get<PrismaService>(PrismaService);
    storageService = module.get<StorageService>(StorageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('uploadFile', () => {
    it('should upload file successfully for admin', async () => {
      const updatedFileRecord = {
        ...mockFileRecord,
        storagePath: 'project-123/file-123-test.pdf',
        uploader: {
          id: 'admin-123',
          email: 'admin@test.com',
          firstName: 'Admin',
          lastName: 'User',
        },
      };
      jest
        .spyOn(prismaService.project, 'findFirst')
        .mockResolvedValue(mockProject);
      jest
        .spyOn(prismaService.file, 'create')
        .mockResolvedValue(mockFileRecord);
      jest
        .spyOn(prismaService.file, 'update')
        .mockResolvedValue(updatedFileRecord as any);
      jest.spyOn(storageService, 'uploadFile').mockResolvedValue(undefined);

      const result = await service.uploadFile(
        'project-123',
        mockFile,
        'Test comment',
        'admin-123',
        Role.ADMIN,
      );

      expect(result).toBeDefined();
      expect(result.id).toBe('file-123');
      expect(storageService.uploadFile).toHaveBeenCalled();
    });

    it('should upload file successfully for project client', async () => {
      const updatedFileRecord = {
        ...mockFileRecord,
        storagePath: 'project-123/file-123-test.pdf',
        uploader: {
          id: 'client-123',
          email: 'client@test.com',
          firstName: 'Client',
          lastName: 'User',
        },
      };
      jest
        .spyOn(prismaService.project, 'findFirst')
        .mockResolvedValue(mockProject);
      jest
        .spyOn(prismaService.file, 'create')
        .mockResolvedValue(mockFileRecord);
      jest
        .spyOn(prismaService.file, 'update')
        .mockResolvedValue(updatedFileRecord as any);
      jest.spyOn(storageService, 'uploadFile').mockResolvedValue(undefined);

      const result = await service.uploadFile(
        'project-123',
        mockFile,
        'Test comment',
        'client-123', // Same as project clientId
        Role.CLIENT,
      );

      expect(result).toBeDefined();
      expect(storageService.uploadFile).toHaveBeenCalled();
    });

    it('should throw NotFoundException for non-existent project', async () => {
      jest.spyOn(prismaService.project, 'findFirst').mockResolvedValue(null);

      await expect(
        service.uploadFile(
          'non-existent',
          mockFile,
          'Test comment',
          'admin-123',
          Role.ADMIN,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for client accessing other project', async () => {
      jest
        .spyOn(prismaService.project, 'findFirst')
        .mockResolvedValue(mockProject);

      await expect(
        service.uploadFile(
          'project-123',
          mockFile,
          'Test comment',
          'different-client', // Different from project clientId
          Role.CLIENT,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException when file is null', async () => {
      jest
        .spyOn(prismaService.project, 'findFirst')
        .mockResolvedValue(mockProject);

      await expect(
        service.uploadFile(
          'project-123',
          null as any,
          'Test comment',
          'admin-123',
          Role.ADMIN,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should rollback database record if storage upload fails', async () => {
      jest
        .spyOn(prismaService.project, 'findFirst')
        .mockResolvedValue(mockProject);
      jest
        .spyOn(prismaService.file, 'create')
        .mockResolvedValue(mockFileRecord);
      jest
        .spyOn(prismaService.file, 'delete')
        .mockResolvedValue(mockFileRecord);
      jest
        .spyOn(storageService, 'uploadFile')
        .mockRejectedValue(new Error('Storage error'));

      await expect(
        service.uploadFile(
          'project-123',
          mockFile,
          'Test comment',
          'admin-123',
          Role.ADMIN,
        ),
      ).rejects.toThrow();

      // Verify database cleanup was attempted
      expect(prismaService.file.delete).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockFileRecord.id },
        }),
      );
    });
  });

  describe('createComment', () => {
    it('should create comment without file', async () => {
      jest
        .spyOn(prismaService.project, 'findFirst')
        .mockResolvedValue(mockProject);
      const commentRecord = {
        ...mockFileRecord,
        filename: null,
        storagePath: null,
        uploader: {
          id: 'client-123',
          email: 'client@test.com',
          firstName: 'Test',
          lastName: 'Client',
        },
      };
      jest
        .spyOn(prismaService.file, 'create')
        .mockResolvedValue(commentRecord as any);

      const result = await service.createComment(
        'project-123',
        'Just a comment',
        'client-123',
        Role.CLIENT,
      );

      expect(result).toBeDefined();
      expect(result.comment).toBe('Test comment');
      expect(result.filename).toBeNull();
    });

    it('should throw ForbiddenException for client on other project', async () => {
      jest
        .spyOn(prismaService.project, 'findFirst')
        .mockResolvedValue(mockProject);

      await expect(
        service.createComment(
          'project-123',
          'Comment',
          'different-client',
          Role.CLIENT,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getFileUrl', () => {
    it('should return presigned URL for admin', async () => {
      jest
        .spyOn(prismaService.file, 'findFirst')
        .mockResolvedValue(mockFileRecord);
      jest
        .spyOn(storageService, 'getDownloadUrl')
        .mockResolvedValue('https://presigned-url.com');

      const result = await service.getFileUrl(
        'file-123',
        'admin-123',
        Role.ADMIN,
      );

      expect(result.downloadUrl).toBe('https://presigned-url.com');
    });

    it('should return presigned URL for project client', async () => {
      jest
        .spyOn(prismaService.file, 'findFirst')
        .mockResolvedValue(mockFileRecord);
      jest
        .spyOn(storageService, 'getDownloadUrl')
        .mockResolvedValue('https://presigned-url.com');

      const result = await service.getFileUrl(
        'file-123',
        'client-123', // Same as project clientId
        Role.CLIENT,
      );

      expect(result.downloadUrl).toBe('https://presigned-url.com');
    });

    it('should throw NotFoundException for non-existent file', async () => {
      jest.spyOn(prismaService.file, 'findFirst').mockResolvedValue(null);

      await expect(
        service.getFileUrl('non-existent', 'admin-123', Role.ADMIN),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for client accessing other project', async () => {
      jest
        .spyOn(prismaService.file, 'findFirst')
        .mockResolvedValue(mockFileRecord);

      await expect(
        service.getFileUrl('file-123', 'different-client', Role.CLIENT),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException for comment without file', async () => {
      const commentOnly = { ...mockFileRecord, storagePath: null };
      jest
        .spyOn(prismaService.file, 'findFirst')
        .mockResolvedValue(commentOnly);

      await expect(
        service.getFileUrl('file-123', 'admin-123', Role.ADMIN),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteFile', () => {
    it('should soft delete file for admin', async () => {
      jest
        .spyOn(prismaService.file, 'findFirst')
        .mockResolvedValue(mockFileRecord);
      jest.spyOn(prismaService.file, 'update').mockResolvedValue({
        ...mockFileRecord,
        deletedAt: new Date(),
        deletedBy: 'admin-123',
      });

      const result = await service.deleteFile(
        'file-123',
        'admin-123',
        Role.ADMIN,
      );

      expect(result.message).toContain('deleted');
      expect(prismaService.file.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'file-123' },
          data: expect.objectContaining({
            deletedBy: 'admin-123',
          }),
        }),
      );
    });

    it('should soft delete file for project client', async () => {
      jest
        .spyOn(prismaService.file, 'findFirst')
        .mockResolvedValue(mockFileRecord);
      jest.spyOn(prismaService.file, 'update').mockResolvedValue({
        ...mockFileRecord,
        deletedAt: new Date(),
      });

      await service.deleteFile('file-123', 'client-123', Role.CLIENT);

      expect(prismaService.file.update).toHaveBeenCalled();
    });

    it('should throw ForbiddenException for client deleting other project file', async () => {
      jest
        .spyOn(prismaService.file, 'findFirst')
        .mockResolvedValue(mockFileRecord);

      await expect(
        service.deleteFile('file-123', 'different-client', Role.CLIENT),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findAllByProject', () => {
    it('should return paginated files for admin', async () => {
      const mockFiles = [mockFileRecord];
      jest.spyOn(prismaService.file, 'findMany').mockResolvedValue(mockFiles);
      jest.spyOn(prismaService.file, 'count').mockResolvedValue(1);
      jest
        .spyOn(prismaService.project, 'findFirst')
        .mockResolvedValue(mockProject);

      const result = await service.findAllByProject(
        'project-123',
        { page: 1, limit: 10 },
        { userId: 'admin-123', role: Role.ADMIN },
      );

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
    });

    it('should convert BigInt size to Number in response', async () => {
      const mockFiles = [mockFileRecord];
      jest.spyOn(prismaService.file, 'findMany').mockResolvedValue(mockFiles);
      jest.spyOn(prismaService.file, 'count').mockResolvedValue(1);
      jest
        .spyOn(prismaService.project, 'findFirst')
        .mockResolvedValue(mockProject);

      const result = await service.findAllByProject(
        'project-123',
        { page: 1, limit: 10 },
        { userId: 'admin-123', role: Role.ADMIN },
      );

      expect(typeof result.data[0].sizeBytes).toBe('number');
    });
  });
});
