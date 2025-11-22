import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { IpAddress } from '../auth/decorators/ip-address.decorator';
import { UserAgent } from '../auth/decorators/user-agent.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import type { UserPayload } from '../auth/interfaces/user.interface';
import { PaginationDto } from '../common/dto/pagination.dto';
import { RATE_LIMIT_PROJECTS } from '../common/constants/timeouts.constants';
import { AuditService, AuditAction } from '../audit/audit.service';

@ApiTags('projects')
@ApiBearerAuth('JWT-auth')
@Controller('projects')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly auditService: AuditService,
  ) {}

  @Post()
  @Roles(Role.ADMIN)
  @Throttle({ default: RATE_LIMIT_PROJECTS.CREATE })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new project',
    description: 'Creates a new project. Only accessible by admins.',
  })
  @ApiResponse({
    status: 201,
    description: 'Project successfully created',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async create(
    @Body() createProjectDto: CreateProjectDto,
    @CurrentUser() user: UserPayload,
    @IpAddress() ipAddress: string,
    @UserAgent() userAgent: string,
  ) {
    const project = await this.projectsService.create(createProjectDto, user.userId);

    // Audit log for project creation (non-blocking)
    try {
      await this.auditService.log({
        userId: user.userId,
        action: AuditAction.PROJECT_CREATE,
        resourceType: 'project',
        resourceId: project.id,
        ipAddress,
        userAgent,
        details: {
          name: createProjectDto.name,
          clientId: createProjectDto.clientId,
        },
      });
    } catch (error) {
      // Audit failure should not block project creation
      console.error('Failed to log audit for project creation:', error);
    }

    return project;
  }

  @Get()
  @Throttle({ default: RATE_LIMIT_PROJECTS.LIST })
  @ApiOperation({
    summary: 'Get all projects',
    description:
      'Retrieves paginated list of projects. Admins see all projects, clients see only their own.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 10, max: 100)',
  })
  @ApiResponse({
    status: 200,
    description: 'Projects retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(
    @CurrentUser() user: UserPayload,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.projectsService.findAll(user.userId, user.role, paginationDto);
  }

  @Get(':id')
  @Throttle({ default: RATE_LIMIT_PROJECTS.GET })
  @ApiOperation({
    summary: 'Get project by ID',
    description: 'Retrieves a single project by ID',
  })
  @ApiParam({
    name: 'id',
    description: 'Project UUID',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Project retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to this project' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  findOne(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    return this.projectsService.findOne(id, user.userId, user.role);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @Throttle({ default: RATE_LIMIT_PROJECTS.UPDATE })
  @ApiOperation({
    summary: 'Update project',
    description: 'Updates an existing project. Only accessible by admins.',
  })
  @ApiParam({
    name: 'id',
    description: 'Project UUID',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Project successfully updated',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async update(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
    @CurrentUser() user: UserPayload,
    @IpAddress() ipAddress: string,
    @UserAgent() userAgent: string,
  ) {
    const project = await this.projectsService.update(
      id,
      updateProjectDto,
      user.userId,
      user.role,
    );

    // Audit log for project update (non-blocking)
    try {
      await this.auditService.log({
        userId: user.userId,
        action: AuditAction.PROJECT_UPDATE,
        resourceType: 'project',
        resourceId: id,
        ipAddress,
        userAgent,
        details: {
          updatedFields: Object.keys(updateProjectDto).join(', '),
        },
      });
    } catch (error) {
      // Audit failure should not block project update
      console.error('Failed to log audit for project update:', error);
    }

    return project;
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @Throttle({ default: RATE_LIMIT_PROJECTS.DELETE })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete project',
    description: 'Soft deletes a project. Only accessible by admins.',
  })
  @ApiParam({
    name: 'id',
    description: 'Project UUID',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Project successfully deleted',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: UserPayload,
    @IpAddress() ipAddress: string,
    @UserAgent() userAgent: string,
  ) {
    const result = await this.projectsService.remove(id, user.userId, user.role);

    // Audit log for project deletion (non-blocking)
    try {
      await this.auditService.log({
        userId: user.userId,
        action: AuditAction.PROJECT_DELETE,
        resourceType: 'project',
        resourceId: id,
        ipAddress,
        userAgent,
      });
    } catch (error) {
      // Audit failure should not block project deletion
      console.error('Failed to log audit for project deletion:', error);
    }

    return result;
  }
}
