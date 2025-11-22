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
 * MinioStorageService
 * Responsibility: Manage MinIO storage operations (upload, download, delete)
 * SRP: Handles only MinIO client operations and orchestration
 */
@Injectable()
export class MinioStorageService implements OnModuleInit {
  private readonly logger = new Logger(MinioStorageService.name);
  private minioClient: Minio.Client;
  private bucketName: string;
  private readonly region: string;

  constructor(
    private configService: ConfigService,
    private fileValidationService: FileValidationService,
    private fileSecurityService: FileSecurityService,
  ) {
    // MinIO configuration - all required in production
    const endpoint = this.configService.get<string>('MINIO_ENDPOINT') ?? '';
    const port = this.configService.get<number>('MINIO_PORT') ?? 0;
    const useSSL =
      this.configService.get<string>('MINIO_USE_SSL', 'false') === 'true';
    const accessKey = this.configService.get<string>('MINIO_ACCESS_KEY') ?? '';
    const secretKey = this.configService.get<string>('MINIO_SECRET_KEY') ?? '';

    this.bucketName = this.configService.get<string>('MINIO_BUCKET') ?? '';
    this.region = this.configService.get<string>('MINIO_REGION', 'us-east-1');

    // Validate required MinIO configuration
    // Note: These errors are intentionally generic to avoid information disclosure
    if (!endpoint || !port || !accessKey || !secretKey || !this.bucketName) {
      this.logger.error(
        'Missing required MinIO configuration. Check environment variables: MINIO_ENDPOINT, MINIO_PORT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY, MINIO_BUCKET',
      );
      throw new Error(
        'Storage service configuration is incomplete. Please contact system administrator.',
      );
    }

    this.minioClient = new Minio.Client({
      endPoint: endpoint,
      port: port,
      useSSL: useSSL,
      accessKey: accessKey,
      secretKey: secretKey,
    });

    this.logger.log(
      `MinIO client initialized - Endpoint: ${endpoint}:${port}, Bucket: ${this.bucketName}`,
    );
  }

  async onModuleInit() {
    try {
      // Check if bucket exists, if not, create it
      const bucketExists = await this.minioClient.bucketExists(this.bucketName);

      if (!bucketExists) {
        await this.minioClient.makeBucket(this.bucketName, this.region);
        this.logger.log(
          `Bucket "${this.bucketName}" created successfully in region "${this.region}"`,
        );
      } else {
        this.logger.log(`Bucket "${this.bucketName}" already exists`);
      }

      // Verify bucket is accessible after creation/check
      const verifyExists = await this.minioClient.bucketExists(this.bucketName);
      if (!verifyExists) {
        throw new Error(
          'Bucket validation failed: unable to verify bucket existence',
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Error initializing MinIO bucket: ${errorMessage}`,
        errorStack,
      );
      // Throw error to prevent application startup with misconfigured storage
      throw new Error(
        'Failed to initialize storage service. Please check MinIO configuration.',
      );
    }
  }

  /**
   * Check if storage is healthy (for health endpoint)
   */
  async checkHealth(): Promise<boolean> {
    try {
      const exists = await this.minioClient.bucketExists(this.bucketName);
      return exists;
    } catch (error) {
      this.logger.error('Storage health check failed', error);
      return false;
    }
  }

  /**
   * Validate bucket exists before operations
   */
  private async validateBucketExists(): Promise<void> {
    try {
      const exists = await this.minioClient.bucketExists(this.bucketName);
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

  /**
   * Upload a file to MinIO
   */
  async uploadFile(
    file: Express.Multer.File,
    projectId: string,
  ): Promise<{ filename: string; storagePath: string }> {
    try {
      // Validate bucket exists before upload
      await this.validateBucketExists();

      // Validate project ID to prevent path traversal (delegated to security service)
      this.fileSecurityService.validateProjectId(projectId);

      // Validate file signature matches claimed MIME type (delegated to security service)
      this.fileSecurityService.validateFileSignature(file);

      // Get secure extension based on MIME type (delegated to validation service)
      const fileExtension = this.fileValidationService.getSecureExtension(file);
      const filename = `${uuidv4()}.${fileExtension}`;
      const storagePath = `projects/${projectId}/${filename}`;

      // Upload the file
      await this.minioClient.putObject(
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

      return {
        filename,
        storagePath,
      };
    } catch (error) {
      // Re-throw BadRequestException as-is (validation errors)
      if (error instanceof BadRequestException) {
        throw error;
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Error uploading file: ${errorMessage}`, errorStack);
      throw new InternalServerErrorException('Error uploading file');
    }
  }

  /**
   * Delete a file from MinIO
   */
  async deleteFile(storagePath: string): Promise<void> {
    try {
      await this.minioClient.removeObject(this.bucketName, storagePath);
      this.logger.log(`File deleted successfully: ${storagePath}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Error deleting file: ${errorMessage}`, errorStack);
      throw new InternalServerErrorException('Error deleting file');
    }
  }

  /**
   * Get download URL for a file
   */
  async getDownloadUrl(
    storagePath: string,
    expirySeconds: number = STORAGE_PRESIGNED_URL_EXPIRY_SECONDS,
  ): Promise<string> {
    try {
      const url = await this.minioClient.presignedGetObject(
        this.bucketName,
        storagePath,
        expirySeconds,
      );
      return url;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Error generating download URL: ${errorMessage}`,
        errorStack,
      );
      throw new InternalServerErrorException('Error generating download URL');
    }
  }
}
