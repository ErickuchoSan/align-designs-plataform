import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';

// Mock modules that import uuid to avoid ESM issues
jest.mock('../storage/storage.service', () => ({
  StorageService: jest.fn().mockImplementation(() => ({})),
}));

import { FilesService } from './files.service';
import { PrismaService } from '../prisma/prisma.service';
import { FilePermissionsService } from './services/file-permissions.service';
import { FileStorageCoordinatorService } from './services/file-storage-coordinator.service';
import { FileTransformerService } from './services/file-transformer.service';
import { CacheManagerService } from '../cache/services/cache-manager.service';
import { FileNotificationService } from './services/file-notification.service';
import { FileMaintenanceService } from './services/file-maintenance.service';

describe('FilesService', () => {
  let service: FilesService;
  let permissions: any;
  let storageCoordinator: any;
  let transformer: any;
  let cacheManager: any;
  let fileNotifications: any;
  let fileMaintenance: any;

  const mockFileRecord = {
    id: 'file-123',
    filename: 'test.pdf',
    projectId: 'p-1',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FilesService,
        {
          provide: PrismaService,
          useValue: {
            file: {
              create: jest.fn(),
              update: jest.fn(),
              findMany: jest.fn(),
            },
          },
        },
        {
          provide: FilePermissionsService,
          useValue: {
            verifyProjectAccess: jest.fn(),
            verifyFileModifyPermission: jest.fn(),
            verifyFileViewPermission: jest.fn(),
            verifyFileDeletePermission: jest.fn(),
          },
        },
        {
          provide: FileStorageCoordinatorService,
          useValue: {
            uploadFileWithTransaction: jest.fn(),
            updateFileWithTransaction: jest.fn(),
            getFileDownloadUrl: jest.fn(),
          },
        },
        {
          provide: FileTransformerService,
          useValue: {
            transformFileRecord: jest.fn().mockReturnValue(mockFileRecord),
            transformFileRecords: jest.fn(),
          },
        },
        {
          provide: CacheManagerService,
          useValue: {
            invalidateFileCaches: jest.fn(),
          },
        },
        {
          provide: FileNotificationService,
          useValue: {
            sendProjectNotifications: jest.fn(),
          },
        },
        {
          provide: FileMaintenanceService,
          useValue: {
            verifyStorageIntegrity: jest.fn(),
            cleanupOrphanedFiles: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<FilesService>(FilesService);
    permissions = module.get<FilePermissionsService>(FilePermissionsService);
    storageCoordinator = module.get<FileStorageCoordinatorService>(
      FileStorageCoordinatorService,
    );
    transformer = module.get<FileTransformerService>(FileTransformerService);
    cacheManager = module.get<CacheManagerService>(CacheManagerService);
    fileNotifications = module.get<FileNotificationService>(
      FileNotificationService,
    );
    fileMaintenance = module.get<FileMaintenanceService>(
      FileMaintenanceService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('uploadFile', () => {
    it('should upload file, notify, and invalidate cache', async () => {
      storageCoordinator.uploadFileWithTransaction.mockResolvedValue(
        mockFileRecord,
      );

      const result = await service.uploadFile(
        'p-1',
        { originalname: 'test.pdf' } as any,
        'comment',
        'u-1',
        Role.CLIENT,
      );

      expect(permissions.verifyProjectAccess).toHaveBeenCalled();
      expect(storageCoordinator.uploadFileWithTransaction).toHaveBeenCalled();
      expect(fileNotifications.sendProjectNotifications).toHaveBeenCalledWith(
        'p-1',
        'u-1',
        'FILE',
        'test.pdf',
      );
      expect(cacheManager.invalidateFileCaches).toHaveBeenCalledWith(
        'p-1',
        'file-123',
      );
      expect(result).toEqual(mockFileRecord);
    });
  });

  /*
  describe('createComment', () => {
     // omitted for brevity, similar flow
  });
  */

  describe('Delegated Methods', () => {
    it('verifyStorageIntegrity delegation', async () => {
      await service.verifyStorageIntegrity('u-1', Role.ADMIN);
      expect(fileMaintenance.verifyStorageIntegrity).toHaveBeenCalledWith(
        'u-1',
        Role.ADMIN,
      );
    });

    it('cleanupOrphanedFiles delegation', async () => {
      await service.cleanupOrphanedFiles('u-1', Role.ADMIN);
      expect(fileMaintenance.cleanupOrphanedFiles).toHaveBeenCalledWith(
        'u-1',
        Role.ADMIN,
      );
    });
  });
});
