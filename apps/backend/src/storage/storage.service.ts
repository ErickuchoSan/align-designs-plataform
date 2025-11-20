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
import { STORAGE_PRESIGNED_URL_EXPIRY_SECONDS } from '../common/constants/timeouts.constants';

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private minioClient: Minio.Client;
  private bucketName: string;

  // Map MIME types to safe file extensions
  private readonly mimeToExtension: Record<string, string> = {
    // Images
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/svg+xml': 'svg',
    // PDFs
    'application/pdf': 'pdf',
    // Documents
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      'docx',
    'application/vnd.ms-excel': 'xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'application/vnd.ms-powerpoint': 'ppt',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation':
      'pptx',
    // Design files
    'application/postscript': 'ai',
    'image/vnd.adobe.photoshop': 'psd',
    'application/illustrator': 'ai',
    // Compressed files
    'application/zip': 'zip',
    'application/x-zip-compressed': 'zip',
    'application/x-rar-compressed': 'rar',
    'application/x-7z-compressed': '7z',
    // Text
    'text/plain': 'txt',
    // Videos
    'video/mp4': 'mp4',
    'video/quicktime': 'mov',
  };

  private readonly region: string;

  constructor(private configService: ConfigService) {
    // MinIO configuration - all required in production
    const endpoint = this.configService.get<string>('MINIO_ENDPOINT') || '';
    const port = this.configService.get<number>('MINIO_PORT') || 0;
    const useSSL =
      this.configService.get<string>('MINIO_USE_SSL', 'false') === 'true';
    const accessKey = this.configService.get<string>('MINIO_ACCESS_KEY') || '';
    const secretKey = this.configService.get<string>('MINIO_SECRET_KEY') || '';

    this.bucketName = this.configService.get<string>('MINIO_BUCKET') || '';
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
   * Validate filename and get safe extension based on MIME type
   * Prevents double extension attacks (e.g., malicious.php.jpg)
   */
  private getSecureExtension(file: Express.Multer.File): string {
    const originalFilename = file.originalname;

    // Check for double extensions (e.g., file.php.jpg, file.exe.png)
    const parts = originalFilename.split('.');
    if (parts.length > 2) {
      this.logger.warn(
        `File with multiple extensions detected: ${originalFilename}`,
      );
      throw new BadRequestException('Invalid file format');
    }

    // Get extension based on MIME type (not user-provided filename)
    const extension = this.mimeToExtension[file.mimetype];
    if (!extension) {
      this.logger.warn(`Unsupported MIME type: ${file.mimetype}`);
      throw new BadRequestException('File type not supported');
    }

    // Optionally validate that user's extension matches (if provided)
    if (parts.length === 2) {
      const userExtension = parts[1].toLowerCase();
      if (
        userExtension !== extension &&
        // Allow jpeg/jpg flexibility
        !(userExtension === 'jpeg' && extension === 'jpg') &&
        !(userExtension === 'jpg' && extension === 'jpg')
      ) {
        this.logger.warn(
          `Extension mismatch: file claims to be .${userExtension} but MIME type is ${file.mimetype}`,
        );
        throw new BadRequestException(
          'File extension does not match file content',
        );
      }
    }

    return extension;
  }

  /**
   * Validate project ID to prevent path traversal attacks
   */
  private validateProjectId(projectId: string): void {
    // Check for path traversal patterns
    const dangerousPatterns = [
      '..', // Parent directory
      './', // Current directory reference
      '../', // Parent directory reference
      '\\', // Windows path separator
      '\0', // Null byte
      '%2e%2e', // URL encoded ..
      '%2f', // URL encoded /
      '%5c', // URL encoded \
    ];

    const lowerProjectId = projectId.toLowerCase();

    for (const pattern of dangerousPatterns) {
      if (lowerProjectId.includes(pattern.toLowerCase())) {
        this.logger.warn(
          `Path traversal attempt detected: ${pattern} in project ID`,
        );
        throw new BadRequestException('Invalid project ID format');
      }
    }

    // UUID format validation (loose check for format)
    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidPattern.test(projectId)) {
      throw new BadRequestException('Invalid project ID format');
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

      // Validate project ID to prevent path traversal
      this.validateProjectId(projectId);

      // Get secure extension based on MIME type (prevents double extension attacks)
      const fileExtension = this.getSecureExtension(file);
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
