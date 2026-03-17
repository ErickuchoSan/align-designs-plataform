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
  BadRequestException,
  Logger,
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
import {
  ApiSuccessResponse,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
} from '../common/decorators/api-responses.decorator';
import { FilesService } from './files.service';
import { FileVersionService } from './file-version.service';
import { FileStageService } from './services/file-stage.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator'; // Restored
import { IpAddress } from '../auth/decorators/ip-address.decorator';
import { UserAgent } from '../auth/decorators/user-agent.decorator';
import { Roles } from '../auth/decorators/roles.decorator'; // Added
import { Role } from '@prisma/client'; // Added
import type { UserPayload } from '../auth/interfaces/user.interface';
import { UploadFileDto } from './dto/upload-file.dto';
import { UpdateFileDto } from './dto/update-file.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { FileValidationPipe } from './pipes/file-validation.pipe';
import {
  RATE_LIMIT_FILES,
  MAX_FILE_SIZE_BYTES,
} from '../common/constants/timeouts.constants';
import { FileFiltersDto } from './dto/file-filters.dto';
import { AuditService, AuditAction } from '../audit/audit.service';
import { safeAuditLog } from '../audit/audit.helper';

@ApiTags('files')
@ApiBearerAuth()
@Controller('files')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FilesController {
  private readonly logger = new Logger(FilesController.name);

  constructor(
    private readonly filesService: FilesService,
    private readonly fileVersionService: FileVersionService,
    private readonly fileStageService: FileStageService,
    private readonly auditService: AuditService,
  ) {}

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
  @ApiCreatedResponse('File uploaded successfully')
  @ApiBadRequestResponse('Invalid file or missing required fields')
  @ApiNotFoundResponse('Project')
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
      uploadFileDto.stage,
      uploadFileDto.relatedFileId,
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
   * Upload new version of a file
   */
  @Post(':id/version')
  @ApiOperation({
    summary: 'Upload new version',
    description:
      'Upload a new version of an existing file (must be current version)',
  })
  @ApiParam({ name: 'id', description: 'Parent File UUID' })
  @ApiConsumes('multipart/form-data')
  @ApiCreatedResponse('Version uploaded successfully')
  @Throttle({ default: RATE_LIMIT_FILES.UPLOAD })
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: MAX_FILE_SIZE_BYTES,
      },
    }),
  )
  async uploadNewVersion(
    @Param('id') id: string,
    @UploadedFile(new FileValidationPipe())
    file: Express.Multer.File | undefined,
    @Body() uploadFileDto: UploadFileDto, // Reusing DTO for comment/notes
    @CurrentUser() user: UserPayload,
    @IpAddress() ipAddress: string,
    @UserAgent() userAgent: string,
  ) {
    if (!file) {
      throw new BadRequestException('File is required for version upload');
    }

    const result = await this.fileVersionService.uploadNewVersion(
      id,
      file,
      user.userId,
      uploadFileDto.comment,
    );

    // Audit log
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
          parentFileId: id,
          filename: file.originalname,
          version: 'new',
        },
      },
      'file version upload',
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
  @ApiCreatedResponse('Comment created successfully')
  @ApiNotFoundResponse('Project')
  @Throttle({ default: RATE_LIMIT_FILES.CREATE_COMMENT })
  @HttpCode(HttpStatus.CREATED)
  async createComment(
    @Param('projectId') projectId: string,
    @Body() createCommentDto: CreateCommentDto,
    @CurrentUser() user: UserPayload,
  ) {
    // Log comment creation for debugging
    this.logger.debug('Creating comment for project', {
      projectId,
      userId: user.userId,
      hasComment: !!createCommentDto.comment,
      stage: createCommentDto.stage,
      relatedFileId: createCommentDto.relatedFileId,
    });

    return this.filesService.createComment(
      projectId,
      createCommentDto.comment,
      user.userId,
      user.role,
      createCommentDto.stage,
      createCommentDto.relatedFileId,
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
  @ApiSuccessResponse('File/comment updated successfully')
  @ApiNotFoundResponse('File record')
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
  @ApiSuccessResponse('Files retrieved successfully')
  @ApiNotFoundResponse('Project')
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
  @ApiSuccessResponse('Types retrieved successfully')
  async getProjectFileTypes(@Param('projectId') projectId: string) {
    return this.filesService.getProjectFileTypes(projectId);
  }

  @Get('project/:projectId/pending-payment')
  @ApiOperation({
    summary: 'Get files pending payment (Admin only)',
    description:
      'Retrieve files marked as pending payment for employee payments',
  })
  @Roles(Role.ADMIN)
  async getPendingPaymentFiles(
    @Param('projectId') projectId: string,
    @Query('employeeId') employeeId?: string,
  ) {
    return this.filesService.findPendingPaymentFiles(projectId, employeeId);
  }

  @Get(':id/download')
  @ApiOperation({
    summary: 'Get file download URL',
    description: 'Generate a presigned URL for downloading a file',
  })
  @ApiParam({ name: 'id', description: 'File UUID' })
  @ApiSuccessResponse('Download URL generated successfully')
  @ApiNotFoundResponse('File')
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
    description:
      'Check for orphaned database records (files that exist in DB but not in MinIO)',
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
            },
          },
        },
      },
    },
  })
  async verifyIntegrity(@CurrentUser() user: UserPayload) {
    return this.filesService.verifyStorageIntegrity(user.userId, user.role);
  }

  @Delete('admin/cleanup-orphans')
  @ApiOperation({
    summary: 'Clean up orphaned file records (Admin only)',
    description:
      'Soft delete database records for files that no longer exist in MinIO storage',
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
            },
          },
        },
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  async cleanupOrphans(
    @CurrentUser() user: UserPayload,
    @IpAddress() ipAddress: string,
    @UserAgent() userAgent: string,
  ) {
    const result = await this.filesService.cleanupOrphanedFiles(
      user.userId,
      user.role,
    );

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

  /**
   * Admin approves a SUBMITTED file (moves to ADMIN_APPROVED)
   */
  @Patch(':id/approve')
  @ApiOperation({
    summary: 'Admin approve file',
    description: 'Move a SUBMITTED file to ADMIN_APPROVED stage (Admin only)',
  })
  @ApiParam({ name: 'id', description: 'File UUID' })
  @ApiSuccessResponse('File approved successfully')
  @ApiBadRequestResponse('File not in SUBMITTED stage or has no content')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  async approveFile(
    @Param('id') id: string,
    @CurrentUser() user: UserPayload,
    @IpAddress() ipAddress: string,
    @UserAgent() userAgent: string,
  ) {
    const result = await this.fileStageService.approveFileByAdmin(
      id,
      user.userId,
    );

    await safeAuditLog(
      this.auditService,
      {
        userId: user.userId,
        action: AuditAction.FILE_UPLOAD, // Using FILE_UPLOAD as proxy for approval
        resourceType: 'file',
        resourceId: id,
        ipAddress,
        userAgent,
        details: { action: 'admin_approve', newStage: 'ADMIN_APPROVED' },
      },
      'file admin approval',
    );

    return result;
  }

  /**
   * Admin rejects a SUBMITTED file
   */
  @Patch(':id/reject')
  @ApiOperation({
    summary: 'Admin reject file',
    description: 'Reject a SUBMITTED file and notify employee (Admin only)',
  })
  @ApiParam({ name: 'id', description: 'File UUID' })
  @ApiBody({
    schema: {
      properties: {
        reason: { type: 'string', description: 'Rejection reason' },
      },
      required: ['reason'],
    },
  })
  @ApiSuccessResponse('File rejected successfully')
  @ApiBadRequestResponse('File not in SUBMITTED stage')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  async rejectFile(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser() user: UserPayload,
    @IpAddress() ipAddress: string,
    @UserAgent() userAgent: string,
  ) {
    if (!reason || reason.trim() === '') {
      throw new BadRequestException('Rejection reason is required');
    }

    const result = await this.fileStageService.rejectFileByAdmin(
      id,
      user.userId,
      reason,
    );

    await safeAuditLog(
      this.auditService,
      {
        userId: user.userId,
        action: AuditAction.FILE_DELETE, // Using FILE_DELETE as proxy for rejection
        resourceType: 'file',
        resourceId: id,
        ipAddress,
        userAgent,
        details: { action: 'admin_reject', reason },
      },
      'file admin rejection',
    );

    return result;
  }

  /**
   * Admin marks file as client approved (moves to CLIENT_APPROVED)
   */
  @Patch(':id/client-approve')
  @ApiOperation({
    summary: 'Mark file as client approved',
    description:
      'Move an ADMIN_APPROVED file to CLIENT_APPROVED stage (Admin only)',
  })
  @ApiParam({ name: 'id', description: 'File UUID' })
  @ApiSuccessResponse('File marked as client approved')
  @ApiBadRequestResponse('File not in ADMIN_APPROVED stage')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  async clientApproveFile(
    @Param('id') id: string,
    @CurrentUser() user: UserPayload,
    @IpAddress() ipAddress: string,
    @UserAgent() userAgent: string,
  ) {
    const result = await this.fileStageService.approveFileByClient(
      id,
      user.userId,
    );

    await safeAuditLog(
      this.auditService,
      {
        userId: user.userId,
        action: AuditAction.FILE_UPLOAD,
        resourceType: 'file',
        resourceId: id,
        ipAddress,
        userAgent,
        details: { action: 'client_approve', newStage: 'CLIENT_APPROVED' },
      },
      'file client approval',
    );

    return result;
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete file',
    description: 'Soft delete a file record',
  })
  @ApiParam({ name: 'id', description: 'File UUID' })
  @ApiSuccessResponse('File deleted successfully')
  @ApiNotFoundResponse('File')
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
