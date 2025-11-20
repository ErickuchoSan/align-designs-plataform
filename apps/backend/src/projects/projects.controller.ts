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
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import type { UserPayload } from '../auth/interfaces/user.interface';
import { PaginationDto } from '../common/dto/pagination.dto';
import { RATE_LIMIT_PROJECTS } from '../common/constants/timeouts.constants';

@ApiTags('projects')
@ApiBearerAuth('JWT-auth')
@Controller('projects')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

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
  create(
    @Body() createProjectDto: CreateProjectDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.projectsService.create(createProjectDto, user.userId);
  }

  @Get()
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
  update(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.projectsService.update(
      id,
      updateProjectDto,
      user.userId,
      user.role,
    );
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
  remove(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    return this.projectsService.remove(id, user.userId, user.role);
  }
}
