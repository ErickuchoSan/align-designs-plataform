import { Injectable } from '@nestjs/common';
import { File } from '@prisma/client';

interface UploaderInfo {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email?: string;
  deletedAt?: Date | null;
}

/**
 * Service responsible for transforming file data for API responses
 * Handles data format conversions like BigInt to Number
 * Handles deleted user references gracefully
 */
@Injectable()
export class FileTransformerService {
  /**
   * Convert a single file record for JSON serialization
   * Transforms BigInt sizeBytes to Number
   * Handles deleted users by showing placeholder info
   */
  transformFileRecord<
    T extends {
      sizeBytes?: bigint | number | null;
      uploader?: UploaderInfo | null;
    },
  >(file: T): Omit<T, 'sizeBytes'> & { sizeBytes: number | null } {
    const transformed = {
      ...file,
      sizeBytes: file.sizeBytes ? Number(file.sizeBytes) : null,
    };

    // Handle deleted user references
    if (transformed.uploader?.deletedAt) {
      transformed.uploader = {
        ...transformed.uploader,
        firstName: 'Deleted',
        lastName: 'User',
        email: undefined, // Hide email for privacy
      };
    }

    return transformed;
  }

  /**
   * Convert multiple file records for JSON serialization
   */
  transformFileRecords<
    T extends {
      sizeBytes?: bigint | number | null;
      uploader?: UploaderInfo | null;
    },
  >(files: T[]): Array<Omit<T, 'sizeBytes'> & { sizeBytes: number | null }> {
    return files.map((file) => this.transformFileRecord(file));
  }
}
