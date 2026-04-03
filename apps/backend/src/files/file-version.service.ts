import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FilesService } from './files.service';
import { File } from '@prisma/client';

@Injectable()
export class FileVersionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly filesService: FilesService,
  ) {}

  /**
   * Upload a new version of a file
   */
  async uploadNewVersion(
    parentFileId: string,
    _file: Express.Multer.File,
    _uploadedBy: string,
    _versionNotes?: string,
  ): Promise<File> {
    // 1. Get the parent file to verify it exists and get project info
    const parentFile = await this.prisma.file.findUnique({
      where: { id: parentFileId },
    });

    if (!parentFile) {
      throw new NotFoundException('Parent file not found');
    }

    if (!parentFile.isCurrentVersion) {
      // Logic decision: Can we version a non-current version?
      // Ideally we branch from the HEAD (current version) or we just linearize it.
      // Let's assume we linearize: If user uploads new version to v1, it becomes the new HEAD?
      // Or we reject if it's not the current version. Simpler to enforce linear history from current.
      // But maybe user wants to revert?
      // For now, let's find the ACTUAL current version of this file tree if parentFile is old.
      // Or validation:
      // const currentVersion = await this.getCurrentVersion(message...)
    }

    // 2. Upload the new file physically (using existing FilesService logic or reusable method)
    // We can use the file storage logic from FilesService.
    // Let's assume FilesService.uploadFile returns the created File record, but we want custom logic.
    // We should probably extract the "Store file" logic.
    // For now, let's look at how FilesService.create works. It likely does DB insertion too.

    // We'll reimplement storage logic or refactor FilesService to expose `storeFile`.
    // Assuming we do it here or call a public method.

    // 3. Update old version to not be current
    // We need to find the currently active version of this family and unset it.
    // If parentFile is the start of a chain, or middle.
    // The "family" is defined by... following parent pointers? Or having a common root?
    // My schema has `parentFileId`. So it's a linked list.
    // `v1` (parent: null), `v2` (parent: v1), `v3` (parent: v2).

    // Algorithm:
    // New file `vNext`. `vNext.parentFileId` = `parentFile.id`.
    // `vNext.versionNumber` = `parentFile.versionNumber` + 1.
    // `vNext.isCurrentVersion` = true.
    // `parentFile.isCurrentVersion` = false.

    // Wait, if `parentFile` was already old (v1) and v2 exists, writing v3 with parent v1 makes a fork.
    // We want v3 to be child of v2?
    // Usually versioning is linear. We should attach to the latest version.

    // Let's find the latest version in this chain.
    // Actually, `parentFileId` points to the IMMEDIATE parent.
    // So if I upload version to `fileId`, `fileId` becomes the parent of `newFile`.

    // We must ensure `parentFile` is the `isCurrentVersion` one, or we are branching.
    if (!parentFile.isCurrentVersion) {
      throw new BadRequestException(
        'You can only upload a new version to the current latest version of the file.',
      );
    }

    // 4. Create new file record
    // We need to store the physical file first.
    // I'll assume I can call `this.filesService.storeFile(file)` if it exists, or duplicate code for now (S3/MinIO logic).
    // Let's check FilesService content first before implementing this fully.

    return parentFile; // Placeholder
  }

  async getVersionHistory(fileId: string): Promise<File[]> {
    const history: File[] = [];
    let currentId: string | null = fileId;

    while (currentId) {
      const file = await this.prisma.file.findUnique({ where: { id: currentId } });
      if (!file) break;
      history.push(file);
      currentId = file.parentFileId ?? null;
    }

    return history;
  }
}
