import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { Role } from '@prisma/client';
import { PaginationDto, PaginatedResult } from '../common/dto/pagination.dto';
import { FileResponse } from '../common/interfaces/file-response.interface';
import { UserContext } from '../common/interfaces/user-context.interface';

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  async uploadFile(
    projectId: string,
    file: Express.Multer.File,
    comment: string | undefined,
    uploadedBy: string,
    userRole: Role,
  ) {
    if (!file) {
      throw new BadRequestException('No file was provided');
    }

    // Verify that the project exists and is not deleted
    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        deletedAt: null,
      },
      include: { client: true },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Verify permissions: client can only upload to their own projects
    if (userRole === Role.CLIENT && project.clientId !== uploadedBy) {
      throw new ForbiddenException(
        'You do not have permission to upload files to this project',
      );
    }

    // Generate filename and storage path
    const filename = `${Date.now()}-${file.originalname}`;
    const storagePath = `projects/${projectId}/${filename}`;

    // Step 1: Create database record with pending status (storagePath as placeholder)
    const fileRecord = await this.prisma.file.create({
      data: {
        filename,
        originalName: file.originalname,
        storagePath: null, // Will be set after successful upload
        mimeType: file.mimetype,
        sizeBytes: file.size,
        comment: comment || null,
        projectId,
        uploadedBy,
      },
      include: {
        uploader: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    try {
      // Step 2: Upload file to MinIO
      await this.storageService.uploadFile(file, projectId);

      // Step 3: Update database record with storagePath after successful upload
      const updatedFileRecord = await this.prisma.file.update({
        where: { id: fileRecord.id },
        data: { storagePath },
        include: {
          uploader: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      // Log successful file upload
      this.logger.log(
        `File uploaded: ${fileRecord.id} (${file.originalname}) to project ${projectId} by user ${uploadedBy}`,
      );

      // Convert BigInt to number for JSON serialization
      return {
        ...updatedFileRecord,
        sizeBytes: updatedFileRecord.sizeBytes
          ? Number(updatedFileRecord.sizeBytes)
          : null,
      };
    } catch (error) {
      // If MinIO upload fails, delete the database record to maintain consistency
      await this.prisma.file.delete({
        where: { id: fileRecord.id },
      });
      this.logger.error(
        `Failed to upload file to MinIO, database record rolled back`,
        error,
      );
      throw error;
    }
  }

  /**
   * Create only comment without file
   */
  async createComment(
    projectId: string,
    comment: string,
    uploadedBy: string,
    userRole: Role,
  ) {
    // Verify that the project exists and is not deleted
    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        deletedAt: null,
      },
      include: { client: true },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Verify permissions: client can only upload to their own projects
    if (userRole === Role.CLIENT && project.clientId !== uploadedBy) {
      throw new ForbiddenException(
        'You do not have permission to create comments in this project',
      );
    }

    // Save comment in database (without file)
    const commentRecord = await this.prisma.file.create({
      data: {
        comment,
        projectId,
        uploadedBy,
      },
      include: {
        uploader: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Convert BigInt to number for JSON serialization
    return {
      ...commentRecord,
      sizeBytes: commentRecord.sizeBytes
        ? Number(commentRecord.sizeBytes)
        : null,
    };
  }

  /**
   * Update comment and/or add file to an existing comment
   */
  async updateFile(
    fileId: string,
    file: Express.Multer.File | undefined,
    comment: string | null | undefined,
    userId: string,
    userRole: Role,
  ) {
    const existingFile = await this.prisma.file.findFirst({
      where: {
        id: fileId,
        deletedAt: null, // Only allow updating non-deleted files
      },
      include: {
        project: true,
      },
    });

    if (!existingFile) {
      throw new NotFoundException('Entry not found');
    }

    // Verify permissions
    if (userRole === Role.CLIENT) {
      if (existingFile.uploadedBy !== userId) {
        throw new ForbiddenException('You can only edit your own entries');
      }
      if (existingFile.project.clientId !== userId) {
        throw new ForbiddenException('You do not have access to this project');
      }
    }

    // Store old file path for cleanup
    const oldStoragePath = existingFile.storagePath;

    // Prepare data to update
    const updateData: {
      comment?: string | null;
      filename?: string;
      originalName?: string;
      storagePath?: string;
      mimeType?: string;
      sizeBytes?: number;
    } = {};

    // If a comment is provided (string or null to remove)
    if (comment !== undefined) {
      updateData.comment = comment;
    }

    // Track new file path for rollback if needed
    let newStoragePath: string | null = null;

    try {
      // If a file is provided, upload it and add to the entry
      if (file) {
        const uploadResult = await this.storageService.uploadFile(
          file,
          existingFile.projectId,
        );
        newStoragePath = uploadResult.storagePath;

        updateData.filename = uploadResult.filename;
        updateData.originalName = file.originalname;
        updateData.storagePath = uploadResult.storagePath;
        updateData.mimeType = file.mimetype;
        updateData.sizeBytes = file.size;
      }

      // Update in database
      const updatedFile = await this.prisma.file.update({
        where: { id: fileId },
        data: updateData,
        include: {
          uploader: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      // Clean up old file from MinIO if a new file was uploaded successfully
      if (file && oldStoragePath) {
        try {
          await this.storageService.deleteFile(oldStoragePath);
          this.logger.debug(
            `Deleted old file from storage: ${oldStoragePath}`,
          );
        } catch (error) {
          // Log but don't fail - old file might already be deleted
          this.logger.warn(
            `Failed to delete old file from storage: ${oldStoragePath}`,
            error,
          );
        }
      }

      // Convert BigInt to number for JSON serialization
      return {
        ...updatedFile,
        sizeBytes: updatedFile.sizeBytes ? Number(updatedFile.sizeBytes) : null,
      };
    } catch (error) {
      // Rollback: If DB update failed and we uploaded a new file, delete it
      if (newStoragePath) {
        try {
          await this.storageService.deleteFile(newStoragePath);
          this.logger.warn(
            `Rolled back new file upload from storage: ${newStoragePath}`,
          );
        } catch (rollbackError) {
          this.logger.error(
            `Failed to rollback new file from storage: ${newStoragePath}`,
            rollbackError,
          );
        }
      }
      throw error;
    }
  }

  async findAllByProject(
    projectId: string,
    paginationDto: PaginationDto,
    userContext: UserContext,
  ): Promise<PaginatedResult<FileResponse>> {
    // Verify that the project exists, is not deleted, and the user has access
    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        deletedAt: null,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (userContext.role === Role.CLIENT && project.clientId !== userContext.userId) {
      throw new ForbiddenException('You do not have access to this project');
    }

    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    // Get total count for pagination metadata
    const total = await this.prisma.file.count({
      where: {
        projectId,
        deletedAt: null, // Only count non-deleted files
      },
    });

    // Get paginated files
    const files = await this.prisma.file.findMany({
      where: {
        projectId,
        deletedAt: null, // Only include non-deleted files
      },
      include: {
        uploader: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
      orderBy: {
        uploadedAt: 'desc',
      },
      skip,
      take: limit,
    });

    // Convert BigInt to number for JSON serialization
    const data = files.map((file) => ({
      ...file,
      sizeBytes: file.sizeBytes ? Number(file.sizeBytes) : null,
    }));

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async getFileUrl(fileId: string, userId: string, userRole: Role) {
    const file = await this.prisma.file.findFirst({
      where: {
        id: fileId,
        deletedAt: null, // Only allow downloading non-deleted files
      },
      include: {
        project: true,
      },
    });

    if (!file) {
      throw new NotFoundException('Entry not found');
    }

    // Verify permissions
    if (userRole === Role.CLIENT && file.project.clientId !== userId) {
      throw new ForbiddenException('You do not have access to this entry');
    }

    // If it's only a comment without a file, there is no URL
    if (!file.storagePath) {
      throw new BadRequestException(
        'This entry does not have a file to download',
      );
    }

    const downloadUrl = await this.storageService.getDownloadUrl(
      file.storagePath,
    );

    return {
      ...file,
      sizeBytes: file.sizeBytes ? Number(file.sizeBytes) : null,
      downloadUrl,
    };
  }

  async deleteFile(fileId: string, userId: string, userRole: Role) {
    const file = await this.prisma.file.findFirst({
      where: {
        id: fileId,
        deletedAt: null, // Only allow deleting non-deleted files
      },
      include: {
        project: true,
      },
    });

    if (!file) {
      throw new NotFoundException('Entry not found');
    }

    // Admin can delete any entry
    // Client can only delete entries they created themselves
    if (userRole === Role.CLIENT) {
      if (file.uploadedBy !== userId) {
        throw new ForbiddenException(
          'You can only delete entries you created yourself',
        );
      }
      if (file.project.clientId !== userId) {
        throw new ForbiddenException('You do not have access to this project');
      }
    }

    // Soft delete from database
    await this.prisma.file.update({
      where: { id: fileId },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
      },
    });

    this.logger.log(`File ${fileId} soft deleted by user ${userId}`);

    return {
      message: file.storagePath
        ? 'File deleted successfully'
        : 'Comment deleted successfully',
    };
  }
}
