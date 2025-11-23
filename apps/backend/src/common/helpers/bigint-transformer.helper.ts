/**
 * BigInt Transformer Helper
 * Centralized utility for converting BigInt to Number for JSON serialization
 *
 * Extracted from duplicated code in projects.service.ts and files transformers
 * Implements DRY principle
 */

export class BigIntTransformer {
  /**
   * Transform a single file object, converting sizeBytes from BigInt to Number
   */
  static transformFileResponse<T extends { sizeBytes?: bigint | null }>(
    file: T,
  ): Omit<T, 'sizeBytes'> & { sizeBytes: number | null } {
    return {
      ...file,
      sizeBytes:
        file.sizeBytes !== null && file.sizeBytes !== undefined
          ? Number(file.sizeBytes)
          : null,
    };
  }

  /**
   * Transform an array of file objects
   */
  static transformFileResponses<T extends { sizeBytes?: bigint | null }>(
    files: T[],
  ): Array<Omit<T, 'sizeBytes'> & { sizeBytes: number | null }> {
    return files.map((file) => this.transformFileResponse(file));
  }

  /**
   * Transform a project response with nested files
   */
  static transformProjectWithFiles<
    T extends { files?: Array<{ sizeBytes?: bigint | null }> },
  >(project: T): T {
    if (!project.files || !Array.isArray(project.files)) {
      return project;
    }

    return {
      ...project,
      files: this.transformFileResponses(project.files),
    };
  }

  /**
   * Generic BigInt to Number converter
   * @param value - Value that might be BigInt
   * @returns Number or null
   */
  static toNumber(value: bigint | number | null | undefined): number | null {
    if (value === null || value === undefined) return null;
    return typeof value === 'bigint' ? Number(value) : value;
  }
}
