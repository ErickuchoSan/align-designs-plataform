import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { StorageService } from './storage.service';
import * as Client from 'minio';

// Mock the minio Client
jest.mock('minio');

describe('StorageService', () => {
  let service: StorageService;
  let mockMinioClient: jest.Mocked<Client.Client>;

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: any) => {
      const config: Record<string, any> = {
        MINIO_ENDPOINT: 'localhost',
        MINIO_PORT: '9000',
        MINIO_USE_SSL: 'false',
        MINIO_ACCESS_KEY: 'test-access-key',
        MINIO_SECRET_KEY: 'test-secret-key',
        MINIO_BUCKET: 'test-bucket',
        MINIO_REGION: 'us-east-1',
      };
      return config[key] ?? defaultValue;
    }),
  };

  beforeEach(async () => {
    // Create mock client
    mockMinioClient = {
      bucketExists: jest.fn().mockResolvedValue(true), // Mock bucket exists by default
      makeBucket: jest.fn().mockResolvedValue(undefined),
      putObject: jest.fn().mockResolvedValue(undefined),
      removeObject: jest.fn().mockResolvedValue(undefined),
      presignedGetObject: jest.fn().mockResolvedValue('https://test-url.com'),
      statObject: jest.fn().mockResolvedValue({ size: 1024 }),
    } as any;

    // Mock the Client constructor
    (Client.Client as jest.MockedClass<typeof Client.Client>).mockImplementation(
      () => mockMinioClient,
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<StorageService>(StorageService);
    // Initialize the service (onModuleInit will be called in most tests)
    await service.onModuleInit();
    // Reset mock call counts after initialization
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('initialization', () => {
    it('should create bucket if it does not exist', async () => {
      mockMinioClient.bucketExists.mockResolvedValue(false);
      mockMinioClient.makeBucket.mockResolvedValue(undefined);

      await service.onModuleInit();

      expect(mockMinioClient.bucketExists).toHaveBeenCalledWith('test-bucket');
      expect(mockMinioClient.makeBucket).toHaveBeenCalledWith(
        'test-bucket',
        'us-east-1',
      );
    });

    it('should not create bucket if it already exists', async () => {
      mockMinioClient.bucketExists.mockResolvedValue(true);

      await service.onModuleInit();

      expect(mockMinioClient.bucketExists).toHaveBeenCalled();
      expect(mockMinioClient.makeBucket).not.toHaveBeenCalled();
    });
  });

  describe('uploadFile', () => {
    const mockFile: Express.Multer.File = {
      buffer: Buffer.from('test file content'),
      originalname: 'test.txt',
      mimetype: 'text/plain',
      size: 100,
    } as Express.Multer.File;

    it('should successfully upload a file', async () => {
      const storagePath = 'projects/123/test.txt';
      mockMinioClient.putObject.mockResolvedValue({
        etag: 'test-etag',
        versionId: 'test-version',
      });

      await service.uploadFile(storagePath, mockFile);

      expect(mockMinioClient.putObject).toHaveBeenCalledWith(
        'test-bucket',
        storagePath,
        mockFile.buffer,
        mockFile.size,
        {
          'Content-Type': mockFile.mimetype,
          'x-amz-meta-original-name': mockFile.originalname,
        },
      );
    });

    it('should reject files with invalid MIME types', async () => {
      const invalidFile = {
        ...mockFile,
        mimetype: 'application/x-msdownload', // .exe file
      };

      await expect(
        service.uploadFile('test/path.exe', invalidFile),
      ).rejects.toThrow(BadRequestException);
    });

    it('should accept allowed MIME types', async () => {
      mockMinioClient.putObject.mockResolvedValue({
        etag: 'test-etag',
        versionId: 'test-version',
      });

      const allowedMimeTypes = [
        'image/jpeg',
        'image/png',
        'application/pdf',
        'text/plain',
      ];

      for (const mimeType of allowedMimeTypes) {
        const file = { ...mockFile, mimetype: mimeType };
        await expect(
          service.uploadFile('test/path', file),
        ).resolves.not.toThrow();
      }
    });
  });

  describe('deleteFile', () => {
    it('should successfully delete a file', async () => {
      const storagePath = 'projects/123/test.txt';
      mockMinioClient.removeObject.mockResolvedValue(undefined);

      await service.deleteFile(storagePath);

      expect(mockMinioClient.removeObject).toHaveBeenCalledWith(
        'test-bucket',
        storagePath,
      );
    });

    it('should handle deletion errors gracefully', async () => {
      const storagePath = 'projects/123/test.txt';
      mockMinioClient.removeObject.mockRejectedValue(
        new Error('File not found'),
      );

      await expect(service.deleteFile(storagePath)).rejects.toThrow();
    });
  });

  describe('getDownloadUrl', () => {
    it('should generate presigned URL for file', async () => {
      const storagePath = 'projects/123/test.txt';
      const mockUrl = 'https://minio.example.com/presigned-url';
      mockMinioClient.presignedGetObject.mockResolvedValue(mockUrl);

      const result = await service.getDownloadUrl(storagePath);

      expect(result).toBe(mockUrl);
      expect(mockMinioClient.presignedGetObject).toHaveBeenCalledWith(
        'test-bucket',
        storagePath,
        900, // STORAGE_PRESIGNED_URL_EXPIRY_SECONDS (15 minutes)
      );
    });

    it('should use custom expiry time if provided', async () => {
      const storagePath = 'projects/123/test.txt';
      const customExpiry = 3600; // 1 hour
      mockMinioClient.presignedGetObject.mockResolvedValue('test-url');

      await service.getDownloadUrl(storagePath, customExpiry);

      expect(mockMinioClient.presignedGetObject).toHaveBeenCalledWith(
        'test-bucket',
        storagePath,
        customExpiry,
      );
    });
  });

  describe('checkHealth', () => {
    it('should return true when MinIO is healthy', async () => {
      mockMinioClient.bucketExists.mockResolvedValue(true);

      const result = await service.checkHealth();

      expect(result).toBe(true);
    });

    it('should return false when MinIO is unhealthy', async () => {
      mockMinioClient.bucketExists.mockRejectedValue(
        new Error('Connection failed'),
      );

      const result = await service.checkHealth();

      expect(result).toBe(false);
    });
  });

  describe('MIME type validation via uploadFile', () => {
    it('should allow image files', async () => {
      const imageFile = {
        originalname: 'test.png',
        mimetype: 'image/png',
        buffer: Buffer.from('test'),
        size: 100,
      } as Express.Multer.File;

      await expect(
        service.uploadFile(imageFile, 'test/path'),
      ).resolves.not.toThrow();
    });

    it('should allow PDF files', async () => {
      const pdfFile = {
        originalname: 'test.pdf',
        mimetype: 'application/pdf',
        buffer: Buffer.from('test'),
        size: 100,
      } as Express.Multer.File;

      await expect(
        service.uploadFile(pdfFile, 'test/path'),
      ).resolves.not.toThrow();
    });

    it('should reject executable files', async () => {
      const exeFile = {
        originalname: 'malware.exe',
        mimetype: 'application/x-msdownload',
        buffer: Buffer.from('test'),
        size: 100,
      } as Express.Multer.File;

      await expect(service.uploadFile(exeFile, 'test/path')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
