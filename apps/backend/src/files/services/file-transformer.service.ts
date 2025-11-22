import { Injectable } from '@nestjs/common';
import { File } from '@prisma/client';

/**
 * Service responsible for transforming file data for API responses
 * Handles data format conversions like BigInt to Number
 */
@Injectable()
export class FileTransformerService {
  /**
   * Convert a single file record for JSON serialization
   * Transforms BigInt sizeBytes to Number
   */
  transformFileRecord<T extends { sizeBytes?: bigint | number | null }>(
    file: T,
  ): Omit<T, 'sizeBytes'> & { sizeBytes: number | null } {
    return {
      ...file,
      sizeBytes: file.sizeBytes ? Number(file.sizeBytes) : null,
    };
  }

  /**
   * Convert multiple file records for JSON serialization
   */
  transformFileRecords<T extends { sizeBytes?: bigint | number | null }>(
    files: T[],
  ): Array<Omit<T, 'sizeBytes'> & { sizeBytes: number | null }> {
    return files.map((file) => this.transformFileRecord(file));
  }
}
