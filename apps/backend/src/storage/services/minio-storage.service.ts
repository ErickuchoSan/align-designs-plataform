import {
  Injectable,
  OnModuleInit,
  Logger,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import { v4 as uuidv4 } from 'uuid';
import { STORAGE_PRESIGNED_URL_EXPIRY_SECONDS } from '../../common/constants/timeouts.constants';
import { FileValidationService } from './file-validation.service';
import { FileSecurityService } from './file-security.service';

/**
 * StorageService
 * Responsibility: Manage S3-compatible storage operations (upload, download, delete)
 * SRP: Handles only storage client operations and orchestration
 * Supports: DigitalOcean Spaces, AWS S3, or any S3-compatible service
 */
@Injectable()
export class MinioStorageService implements OnModuleInit {
  private readonly logger = new Logger(MinioStorageService.name);
  private readonly storageClient: Minio.Client;
  private readonly bucketName: string;
  private readonly region: string;
  private readonly internalEndpoint: string;
  private readonly internalPort: number;
  private readonly publicEndpoint: string | null;
  private readonly publicPort: number;
  private readonly publicUseSSL: boolean;

  constructor(
    private readonly configService: ConfigService,
    private readonly fileValidationService: FileValidationService,
    private readonly fileSecurityService: FileSecurityService,
  ) {
    // Storage configuration (S3-compatible: DigitalOcean Spaces, AWS S3, etc.)
    const endpoint = this.configService.get<string>('STORAGE_ENDPOINT') ?? '';
    const port = Number.parseInt(
      this.configService.get<string>('STORAGE_PORT', '443'),
      10,
    );
    const useSSL =
      this.configService.get<string>('STORAGE_USE_SSL', 'true') === 'true';
    const accessKey =
      this.configService.get<string>('STORAGE_ACCESS_KEY') ?? '';
    const secretKey =
      this.configService.get<string>('STORAGE_SECRET_KEY') ?? '';

    this.bucketName = this.configService.get<string>('STORAGE_BUCKET') ?? '';
    this.region = this.configService.get<string>('STORAGE_REGION', 'us-east-1');

    // Store internal endpoint info for URL replacement
    this.internalEndpoint = endpoint;
    this.internalPort = port;

    // Public endpoint for presigned URLs (optional, defaults to internal)
    this.publicEndpoint =
      this.configService.get<string>('STORAGE_PUBLIC_ENDPOINT') ?? null;
    this.publicPort = Number.parseInt(
      this.configService.get<string>('STORAGE_PUBLIC_PORT', '443'),
      10,
    );
    this.publicUseSSL =
      this.configService.get<string>('STORAGE_PUBLIC_USE_SSL', 'true') ===
      'true';

    // Validate required storage configuration
    if (!endpoint || !port || !accessKey || !secretKey || !this.bucketName) {
      this.logger.error(
        'Missing required storage configuration. Check environment variables: STORAGE_ENDPOINT, STORAGE_PORT, STORAGE_ACCESS_KEY, STORAGE_SECRET_KEY, STORAGE_BUCKET',
      );
      throw new Error(
        'Storage service configuration is incomplete. Please contact system administrator.',
      );
    }

    this.storageClient = new Minio.Client({
      endPoint: endpoint,
      port: port,
      useSSL: useSSL,
      accessKey: accessKey,
      secretKey: secretKey,
      region: this.region,
      pathStyle:
        this.configService.get<string>('STORAGE_PATH_STYLE', 'false') ===
        'true',
    });

    this.logger.log(
      `Storage client initialized - Endpoint: ${endpoint}:${port}, Bucket: ${this.bucketName}`,
    );
  }

  async onModuleInit() {
    const skipBucketCheck =
      this.configService.get<string>('STORAGE_SKIP_BUCKET_CHECK', 'false') ===
      'true';

    try {
      if (skipBucketCheck) {
        this.logger.log(
          `Skipping bucket check - using managed bucket "${this.bucketName}"`,
        );
        return;
      }

      const bucketExists = await this.storageClient.bucketExists(
        this.bucketName,
      );

      if (bucketExists) {
        this.logger.log(`Bucket "${this.bucketName}" already exists`);
      } else {
        await this.storageClient.makeBucket(this.bucketName, this.region);
        this.logger.log(
          `Bucket "${this.bucketName}" created successfully in region "${this.region}"`,
        );
      }

      const verifyExists = await this.storageClient.bucketExists(
        this.bucketName,
      );
      if (!verifyExists) {
        throw new Error('Bucket validation failed');
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error initializing storage bucket: ${errorMessage}`);
      throw new Error('Failed to initialize storage service.');
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      const exists = await this.storageClient.bucketExists(this.bucketName);
      return exists;
    } catch (error) {
      this.logger.error('Storage health check failed', error);
      return false;
    }
  }

  private async validateBucketExists(): Promise<void> {
    try {
      const exists = await this.storageClient.bucketExists(this.bucketName);
      if (!exists) {
        this.logger.error(`Bucket "${this.bucketName}" does not exist`);
        throw new InternalServerErrorException(
          'Storage service is not properly configured',
        );
      }
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      this.logger.error('Error checking bucket existence', error);
      throw new InternalServerErrorException('Storage service unavailable');
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    projectId: string,
  ): Promise<{ filename: string; storagePath: string }> {
    try {
      await this.validateBucketExists();
      this.fileSecurityService.validateProjectId(projectId);
      this.fileSecurityService.validateFileSignature(file);

      const fileExtension = this.fileValidationService.getSecureExtension(file);
      const filename = `${uuidv4()}.${fileExtension}`;
      const storagePath = `projects/${projectId}/${filename}`;

      await this.storageClient.putObject(
        this.bucketName,
        storagePath,
        file.buffer,
        file.size,
        {
          'Content-Type': file.mimetype,
          'Original-Name': file.originalname,
        },
      );

      this.logger.log(`File uploaded successfully: ${storagePath}`);
      return { filename, storagePath };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error uploading file: ${errorMessage}`);
      throw new InternalServerErrorException('Error uploading file');
    }
  }

  async deleteFile(storagePath: string): Promise<void> {
    try {
      await this.storageClient.removeObject(this.bucketName, storagePath);
      this.logger.log(`File deleted successfully: ${storagePath}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error deleting file: ${errorMessage}`);
      throw new InternalServerErrorException('Error deleting file');
    }
  }

  async getDownloadUrl(
    storagePath: string,
    expirySeconds: number = STORAGE_PRESIGNED_URL_EXPIRY_SECONDS,
  ): Promise<string> {
    try {
      try {
        await this.storageClient.statObject(this.bucketName, storagePath);
      } catch {
        this.logger.warn(`File not found in storage: ${storagePath}`);
        throw new BadRequestException(
          'The requested file does not exist in storage.',
        );
      }

      let url = await this.storageClient.presignedGetObject(
        this.bucketName,
        storagePath,
        expirySeconds,
      );

      if (this.publicEndpoint) {
        const internalUrl = `http://${this.internalEndpoint}:${this.internalPort}`;
        const publicProtocol = this.publicUseSSL ? 'https' : 'http';
        const publicUrl =
          this.publicPort === 443 || this.publicPort === 80
            ? `${publicProtocol}://${this.publicEndpoint}`
            : `${publicProtocol}://${this.publicEndpoint}:${this.publicPort}`;

        url = url.replace(internalUrl, publicUrl);
      }

      return url;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error generating download URL: ${errorMessage}`);
      throw new InternalServerErrorException('Error generating download URL');
    }
  }

  async fileExists(storagePath: string): Promise<boolean> {
    try {
      await this.storageClient.statObject(this.bucketName, storagePath);
      return true;
    } catch {
      return false;
    }
  }
}
