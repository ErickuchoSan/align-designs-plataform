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
  MaxFileSizeValidator,
  FileTypeValidator,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { FilesService } from './files.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { UserPayload } from '../auth/interfaces/user.interface';
import { UploadFileDto } from './dto/upload-file.dto';
import { UpdateFileDto } from './dto/update-file.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { FileValidationPipe } from './pipes/file-validation.pipe';
import { RATE_LIMIT_FILES } from '../common/constants/timeouts.constants';
import { PaginationDto } from '../common/dto/pagination.dto';

@Controller('files')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  /**
   * Upload file with optional comment
   */
  @Post(':projectId/upload')
  @Throttle({ default: RATE_LIMIT_FILES.UPLOAD })
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @Param('projectId') projectId: string,
    @UploadedFile(new FileValidationPipe())
    file: Express.Multer.File | undefined,
    @Body() uploadFileDto: UploadFileDto,
    @CurrentUser() user: UserPayload,
  ) {
    if (!file) {
      throw new BadRequestException('File is required for upload');
    }
    return this.filesService.uploadFile(
      projectId,
      file,
      uploadFileDto.comment,
      user.userId,
      user.role,
    );
  }

  /**
   * Create only comment without file
   */
  @Post(':projectId/comment')
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
  @Throttle({ default: RATE_LIMIT_FILES.UPDATE })
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
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
  async findAllByProject(
    @Param('projectId') projectId: string,
    @Query() paginationDto: PaginationDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.filesService.findAllByProject(
      projectId,
      paginationDto,
      { userId: user.userId, role: user.role },
    );
  }

  @Get(':id/download')
  @Throttle({ default: RATE_LIMIT_FILES.DOWNLOAD })
  async getFileUrl(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    return this.filesService.getFileUrl(id, user.userId, user.role);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteFile(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    return this.filesService.deleteFile(id, user.userId, user.role);
  }
}
