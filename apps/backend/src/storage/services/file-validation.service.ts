import { Injectable, Logger, BadRequestException } from '@nestjs/common';

/**
 * FileValidationService
 * Responsibility: Validate file format, extensions, and MIME types
 * SRP: Handles only file format validation logic
 */
@Injectable()
export class FileValidationService {
  private readonly logger = new Logger(FileValidationService.name);

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

  /**
   * Validate filename and get safe extension based on MIME type
   * Prevents double extension attacks (e.g., malicious.php.jpg)
   */
  getSecureExtension(file: Express.Multer.File): string {
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
   * Check if MIME type is supported
   */
  isMimeTypeSupported(mimeType: string): boolean {
    return mimeType in this.mimeToExtension;
  }

  /**
   * Get all supported MIME types
   */
  getSupportedMimeTypes(): string[] {
    return Object.keys(this.mimeToExtension);
  }

  /**
   * Get extension for a given MIME type
   */
  getExtensionForMimeType(mimeType: string): string | undefined {
    return this.mimeToExtension[mimeType];
  }
}
