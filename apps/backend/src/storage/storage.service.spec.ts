// Mock uuid before any imports that transitively use it
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-1234'),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { StorageService } from './storage.service';
import { MinioStorageService } from './services/minio-storage.service';

describe('StorageService', () => {
  let service: StorageService;
  let minioStorageService: jest.Mocked<MinioStorageService>;

  const mockMinioStorageService = {
    uploadFile: jest.fn(),
    deleteFile: jest.fn(),
    getDownloadUrl: jest.fn(),
    checkHealth: jest.fn(),
    fileExists: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        {
          provide: MinioStorageService,
          useValue: mockMinioStorageService,
        },
      ],
    }).compile();

    service = module.get<StorageService>(StorageService);
    minioStorageService = module.get(MinioStorageService);

    // Reset mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('uploadFile', () => {
    const mockFile: Express.Multer.File = {
      buffer: Buffer.from('test file content'),
      originalname: 'test.txt',
      mimetype: 'text/plain',
      size: 100,
    } as Express.Multer.File;

    it('should delegate to MinioStorageService', async () => {
      const expectedResult = {
        filename: 'uuid-test.txt',
        storagePath: 'projects/123/uuid-test.txt',
      };
      mockMinioStorageService.uploadFile.mockResolvedValue(expectedResult);

      const result = await service.uploadFile(mockFile, '123');

      expect(minioStorageService.uploadFile).toHaveBeenCalledWith(
        mockFile,
        '123',
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe('deleteFile', () => {
    it('should delegate to MinioStorageService', async () => {
      const storagePath = 'projects/123/test.txt';
      mockMinioStorageService.deleteFile.mockResolvedValue(undefined);

      await service.deleteFile(storagePath);

      expect(minioStorageService.deleteFile).toHaveBeenCalledWith(storagePath);
    });
  });

  describe('getDownloadUrl', () => {
    it('should delegate to MinioStorageService', async () => {
      const storagePath = 'projects/123/test.txt';
      const mockUrl = 'https://minio.example.com/presigned-url';
      mockMinioStorageService.getDownloadUrl.mockResolvedValue(mockUrl);

      const result = await service.getDownloadUrl(storagePath);

      expect(minioStorageService.getDownloadUrl).toHaveBeenCalledWith(
        storagePath,
        undefined,
      );
      expect(result).toBe(mockUrl);
    });

    it('should pass custom expiry time to MinioStorageService', async () => {
      const storagePath = 'projects/123/test.txt';
      const customExpiry = 3600;
      mockMinioStorageService.getDownloadUrl.mockResolvedValue('test-url');

      await service.getDownloadUrl(storagePath, customExpiry);

      expect(minioStorageService.getDownloadUrl).toHaveBeenCalledWith(
        storagePath,
        customExpiry,
      );
    });
  });

  describe('checkHealth', () => {
    it('should return true when MinIO is healthy', async () => {
      mockMinioStorageService.checkHealth.mockResolvedValue(true);

      const result = await service.checkHealth();

      expect(result).toBe(true);
      expect(minioStorageService.checkHealth).toHaveBeenCalled();
    });

    it('should return false when MinIO is unhealthy', async () => {
      mockMinioStorageService.checkHealth.mockResolvedValue(false);

      const result = await service.checkHealth();

      expect(result).toBe(false);
    });
  });

  describe('fileExists', () => {
    it('should delegate to MinioStorageService', async () => {
      const storagePath = 'projects/123/test.txt';
      mockMinioStorageService.fileExists.mockResolvedValue(true);

      const result = await service.fileExists(storagePath);

      expect(minioStorageService.fileExists).toHaveBeenCalledWith(storagePath);
      expect(result).toBe(true);
    });

    it('should return false when file does not exist', async () => {
      mockMinioStorageService.fileExists.mockResolvedValue(false);

      const result = await service.fileExists('non-existent');

      expect(result).toBe(false);
    });
  });
});
