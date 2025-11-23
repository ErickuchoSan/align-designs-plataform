import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import {
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_MB,
} from '../../common/constants/timeouts.constants';
import { FileMagicNumberValidator } from '../../common/utils/file-magic-numbers.utils';

@Injectable()
export class FileValidationPipe implements PipeTransform {
  // Allow images, PDFs, documents and design files
  private readonly allowedMimeTypes = [
    // Images
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    // PDFs
    'application/pdf',
    // Documents
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    // Design files
    'application/postscript', // AI files
    'image/vnd.adobe.photoshop', // PSD files
    'application/illustrator', // AI files alternative
    // Compressed files
    'application/zip',
    'application/x-zip-compressed',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
    // Text
    'text/plain',
    // Videos (if needed)
    'video/mp4',
    'video/quicktime',
  ];

  transform(file: Express.Multer.File): Express.Multer.File {
    if (!file) {
      // If no file, allow (for comment-only updates)
      return file;
    }

    // Validate file is not empty
    if (file.size === 0) {
      throw new BadRequestException('File cannot be empty (0 bytes)');
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      const maxSizeGB = (MAX_FILE_SIZE_MB / 1000).toFixed(0);
      throw new BadRequestException(
        `File exceeds maximum allowed size of ${maxSizeGB}GB`,
      );
    }

    // Validate MIME type
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `File type not allowed. Allowed types: images, PDFs, Office documents, design files (AI, PSD), compressed files, and videos.`,
      );
    }

    // Validate file magic numbers (actual file content)
    if (file.buffer) {
      const isValidSignature = FileMagicNumberValidator.validateFileSignature(
        file.buffer,
        file.mimetype,
      );

      if (!isValidSignature) {
        throw new BadRequestException(
          `File content does not match the claimed file type. Possible file spoofing detected.`,
        );
      }
    }

    return file;
  }
}
