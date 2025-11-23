import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as path from 'path';
import { FileMagicNumberValidator } from '../../common/utils/file-magic-numbers.utils';

/**
 * FileSecurityService
 * Responsibility: Validate file security (path traversal, magic numbers, project ID validation)
 * SRP: Handles only file security validations
 */
@Injectable()
export class FileSecurityService {
  private readonly logger = new Logger(FileSecurityService.name);

  /**
   * Validate project ID to prevent path traversal attacks
   * Enhanced validation using path normalization
   */
  validateProjectId(projectId: string): void {
    this.logger.debug(`Validating project ID: "${projectId}" (type: ${typeof projectId}, length: ${projectId?.length})`);

    // UUID format validation (strict check first)
    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidPattern.test(projectId)) {
      this.logger.warn(`UUID pattern test failed for: "${projectId}"`);
      throw new BadRequestException('Invalid project ID format');
    }

    // Check for path traversal patterns
    const dangerousPatterns = [
      '..', // Parent directory
      './', // Current directory reference
      '../', // Parent directory reference
      '\\', // Windows path separator
      '\0', // Null byte
      '%2e%2e', // URL encoded ..
      '%2e%2E', // Mixed case URL encoded ..
      '%2E%2e', // Mixed case URL encoded ..
      '%2E%2E', // Mixed case URL encoded ..
      '%2f', // URL encoded /
      '%2F', // URL encoded / (uppercase)
      '%5c', // URL encoded \
      '%5C', // URL encoded \ (uppercase)
      '\u0000', // Unicode null byte
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

    // Additional validation: normalize path and ensure it doesn't escape
    // Use POSIX path for consistent behavior across Windows and Unix
    const normalizedPath = path.posix.normalize(`/${projectId}`);
    if (normalizedPath !== `/${projectId}`) {
      this.logger.warn(
        `Path normalization mismatch: ${projectId} -> ${normalizedPath}`,
      );
      throw new BadRequestException('Invalid project ID format');
    }

    // Ensure path doesn't contain path traversal attempts
    if (
      normalizedPath.includes('..') ||
      normalizedPath.split('/').length > 2
    ) {
      this.logger.warn(`Path traversal in normalized path: ${normalizedPath}`);
      throw new BadRequestException('Invalid project ID format');
    }
  }

  /**
   * Validate file signature matches claimed MIME type
   * Uses magic number validation to prevent file spoofing attacks
   */
  validateFileSignature(file: Express.Multer.File): void {
    const isValid = FileMagicNumberValidator.validateFileSignature(
      file.buffer,
      file.mimetype,
    );

    if (!isValid) {
      this.logger.warn(
        `File signature mismatch: file claims to be ${file.mimetype} but signature doesn't match`,
      );
      throw new BadRequestException(
        'File content does not match the declared file type. This may indicate a malicious file.',
      );
    }
  }

  /**
   * Validate that a path is safe (doesn't contain traversal attempts)
   */
  validatePathSafety(filePath: string): void {
    // Use POSIX path for consistent behavior across Windows and Unix
    const normalizedPath = path.posix.normalize(filePath);

    // Check if normalization changed the path (indication of traversal attempt)
    if (normalizedPath !== filePath) {
      this.logger.warn(
        `Unsafe path detected: ${filePath} normalized to ${normalizedPath}`,
      );
      throw new BadRequestException('Invalid file path');
    }

    // Check for dangerous patterns
    if (
      normalizedPath.includes('..') ||
      normalizedPath.includes('\0') ||
      normalizedPath.includes('%2e%2e')
    ) {
      this.logger.warn(`Path traversal attempt in path: ${filePath}`);
      throw new BadRequestException('Invalid file path');
    }
  }
}
