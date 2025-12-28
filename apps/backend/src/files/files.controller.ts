import {
  Controller,
  Post,
  Get,
  Delete,
  Patch,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
  Body,
  ParseFilePipe,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FilesService } from './files.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { IpAddress } from '../auth/decorators/ip-address.decorator';
import { UserAgent } from '../auth/decorators/user-agent.decorator';
import type { UserPayload } from '../auth/interfaces/user.interface';
import { UploadFileDto } from './dto/upload-file.dto';
import { UpdateFileDto } from './dto/update-file.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { FileValidationPipe } from './pipes/file-validation.pipe';
import {
  RATE_LIMIT_FILES,
  MAX_FILE_SIZE_BYTES,
} from '../common/constants/timeouts.constants';
import { PaginationDto } from '../common/dto/pagination.dto';
import { FileFiltersDto } from './dto/file-filters.dto';
import { AuditService, AuditAction } from '../audit/audit.service';
import { safeAuditLog } from '../audit/audit.helper';

@ApiTags('files')
@ApiBearerAuth()
@Controller('files')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FilesController {
  constructor(
    private readonly filesService: FilesService,
    private readonly auditService: AuditService,
  ) { }

  /**
   * Upload file with optional comment
   */
  @Post(':projectId/upload')
  @ApiOperation({
    summary: 'Upload file to project',
    description: 'Upload a file with an optional comment to a specific project',
  })
  @ApiParam({ name: 'projectId', description: 'Project UUID' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'File uploaded successfully' })
  @ApiResponse({
    status: 400,
    description: 'Invalid file or missing required fields',
  })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @Throttle({ default: RATE_LIMIT_FILES.UPLOAD })
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: MAX_FILE_SIZE_BYTES, // Enforce size limit BEFORE upload
      },
    }),
  )
  async uploadFile(
    @Param('projectId') projectId: string,
    @UploadedFile(new FileValidationPipe())
    file: Express.Multer.File | undefined,
    @Body() uploadFileDto: UploadFileDto,
    @CurrentUser() user: UserPayload,
    @IpAddress() ipAddress: string,
    @UserAgent() userAgent: string,
  ) {
    if (!file) {
      throw new BadRequestException('File is required for upload');
    }
    const result = await this.filesService.uploadFile(
      projectId,
      file,
      uploadFileDto.comment,
      user.userId,
      user.role,
    );

    // Audit log for file upload (non-blocking)
    await safeAuditLog(
      this.auditService,
      {
        userId: user.userId,
        action: AuditAction.FILE_UPLOAD,
        resourceType: 'file',
        resourceId: result.id,
        ipAddress,
        userAgent,
        details: {
          projectId,
          filename: file.originalname,
          size: file.size,
          mimeType: file.mimetype,
        },
      },
      'file upload',
    );

    return result;
  }

  /**
   * Create only comment without file
   */
  @Post(':projectId/comment')
  @ApiOperation({
    summary: 'Create comment without file',
    description: 'Create a comment for a project without uploading a file',
  })
  @ApiParam({ name: 'projectId', description: 'Project UUID' })
  @ApiResponse({ status: 201, description: 'Comment created successfully' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @Throttle({ default: RATE_LIMIT_FILES.CREATE_COMMENT })
  @HttpCode(HttpStatus.CREATED)
  async createComment(
    @Param('projectId') projectId: string,
    @Body() createCommentDto: CreateCommentDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.filesService.createComment(
      projectId,
      createCommentDto.comment,
      user.userId,
      user.role,
    );
  }

  /**
   * Update comment and/or add file to an existing comment
   */
  @Patch(':id')
  @ApiOperation({
    summary: 'Update file or comment',
    description: 'Update an existing file record or add a file to a comment',
  })
  @ApiParam({ name: 'id', description: 'File record UUID' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 200,
    description: 'File/comment updated successfully',
  })
  @ApiResponse({ status: 404, description: 'File record not found' })
  @Throttle({ default: RATE_LIMIT_FILES.UPDATE })
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: MAX_FILE_SIZE_BYTES, // Enforce size limit BEFORE upload
      },
    }),
  )
  async updateFile(
    @Param('id') id: string,
    @UploadedFile(new FileValidationPipe())
    file: Express.Multer.File | undefined,
    @Body() updateFileDto: UpdateFileDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.filesService.updateFile(
      id,
      file,
      updateFileDto.comment,
      user.userId,
      user.role,
    );
  }

  @Get('project/:projectId')
  @ApiOperation({
    summary: 'Get project files',
    description:
      'Retrieve paginated and filtered list of files for a specific project',
  })
  @ApiParam({ name: 'projectId', description: 'Project UUID' })
  @ApiResponse({ status: 200, description: 'Files retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async findAllByProject(
    @Param('projectId') projectId: string,
    @Query() fileFilters: FileFiltersDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.filesService.findAllByProject(projectId, fileFilters, {
      userId: user.userId,
      role: user.role,
    });
  }

  @Get('project/:projectId/types')
  @ApiOperation({
    summary: 'Get available file types',
    description: 'Get list of unique file extensions in the project',
  })
  @ApiParam({ name: 'projectId', description: 'Project UUID' })
  @ApiResponse({ status: 200, description: 'Types retrieved successfully' })
  async getProjectFileTypes(@Param('projectId') projectId: string) {
    return this.filesService.getProjectFileTypes(projectId);
  }

  @Get(':id/download')
  @ApiOperation({
    summary: 'Get file download URL',
    description: 'Generate a presigned URL for downloading a file',
  })
  @ApiParam({ name: 'id', description: 'File UUID' })
  @ApiResponse({
    status: 200,
    description: 'Download URL generated successfully',
  })
  @ApiResponse({ status: 404, description: 'File not found' })
  @Throttle({ default: RATE_LIMIT_FILES.DOWNLOAD })
  async getFileUrl(
    @Param('id') id: string,
    @CurrentUser() user: UserPayload,
    @IpAddress() ipAddress: string,
    @UserAgent() userAgent: string,
  ) {
    const result = await this.filesService.getFileUrl(
      id,
      user.userId,
      user.role,
    );

    // Audit log for file download (non-blocking)
    await safeAuditLog(
      this.auditService,
      {
        userId: user.userId,
        action: AuditAction.FILE_DOWNLOAD,
        resourceType: 'file',
        resourceId: id,
        ipAddress,
        userAgent,
      },
      'file download',
    );

    return result;
  }

  @Get('admin/verify-integrity')
  @ApiOperation({
    summary: 'Verify file storage integrity (Admin only)',
    description: 'Check for orphaned database records (files that exist in DB but not in MinIO)',
  })
  @ApiResponse({
    status: 200,
    description: 'Integrity check completed',
    schema: {
      properties: {
        totalFiles: { type: 'number' },
        orphanedFiles: { type: 'number' },
        orphans: {
          type: 'array',
          items: {
            properties: {
              id: { type: 'string' },
              filename: { type: 'string' },
              storagePath: { type: 'string' },
              projectId: { type: 'string' },
              uploadedAt: { type: 'string' },
            }
          }
        }
      }
    }
  })
  async verifyIntegrity(@CurrentUser() user: UserPayload) {
    return this.filesService.verifyStorageIntegrity(user.userId, user.role);
  }

  @Delete('admin/cleanup-orphans')
  @ApiOperation({
    summary: 'Clean up orphaned file records (Admin only)',
    description: 'Soft delete database records for files that no longer exist in MinIO storage',
  })
  @ApiResponse({
    status: 200,
    description: 'Cleanup completed',
    schema: {
      properties: {
        totalChecked: { type: 'number' },
        orphansFound: { type: 'number' },
        orphansDeleted: { type: 'number' },
        failures: { type: 'number' },
        deletedFiles: {
          type: 'array',
          items: {
            properties: {
              id: { type: 'string' },
              filename: { type: 'string' },
              storagePath: { type: 'string' },
            }
          }
        }
      }
    }
  })
  @HttpCode(HttpStatus.OK)
  async cleanupOrphans(
    @CurrentUser() user: UserPayload,
    @IpAddress() ipAddress: string,
    @UserAgent() userAgent: string,
  ) {
    const result = await this.filesService.cleanupOrphanedFiles(user.userId, user.role);

    // Audit log for cleanup operation
    await safeAuditLog(
      this.auditService,
      {
        userId: user.userId,
        action: AuditAction.FILE_DELETE,
        resourceType: 'file',
        resourceId: 'bulk-orphan-cleanup',
        ipAddress,
        userAgent,
        details: {
          orphansDeleted: result.orphansDeleted,
          failures: result.failures,
        },
      },
      'orphan cleanup',
    );

    return result;
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete file',
    description: 'Soft delete a file record',
  })
  @ApiParam({ name: 'id', description: 'File UUID' })
  @ApiResponse({ status: 200, description: 'File deleted successfully' })
  @ApiResponse({ status: 404, description: 'File not found' })
  @Throttle({ default: RATE_LIMIT_FILES.DELETE })
  @HttpCode(HttpStatus.OK)
  async deleteFile(
    @Param('id') id: string,
    @CurrentUser() user: UserPayload,
    @IpAddress() ipAddress: string,
    @UserAgent() userAgent: string,
  ) {
    const result = await this.filesService.deleteFile(
      id,
      user.userId,
      user.role,
    );

    // Audit log for file deletion (non-blocking)
    await safeAuditLog(
      this.auditService,
      {
        userId: user.userId,
        action: AuditAction.FILE_DELETE,
        resourceType: 'file',
        resourceId: id,
        ipAddress,
        userAgent,
      },
      'file deletion',
    );

    return result;
  }
}
