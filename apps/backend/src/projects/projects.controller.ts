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
import { safeAuditLog } from '../audit/audit.helper';
import { ProjectEmployeeService } from './services/project-employee.service';
import { ProjectStatusService } from './services/project-status.service';
import { AssignEmployeesDto } from './dto/assign-employees.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';

@ApiTags('projects')
@ApiBearerAuth('JWT-auth')
@Controller('projects')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly auditService: AuditService,
    private readonly projectEmployeeService: ProjectEmployeeService,
    private readonly projectStatusService: ProjectStatusService,
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
    const project = await this.projectsService.create(
      createProjectDto,
      user.userId,
    );

    if (!project) {
      throw new Error('Failed to create project');
    }

    // Audit log for project creation (non-blocking)
    await safeAuditLog(
      this.auditService,
      {
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
      },
      'project creation',
    );

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
  @ApiResponse({
    status: 403,
    description: 'Forbidden - No access to this project',
  })
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
    await safeAuditLog(
      this.auditService,
      {
        userId: user.userId,
        action: AuditAction.PROJECT_UPDATE,
        resourceType: 'project',
        resourceId: id,
        ipAddress,
        userAgent,
        details: {
          updatedFields: Object.keys(updateProjectDto).join(', '),
        },
      },
      'project update',
    );

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
    const result = await this.projectsService.remove(
      id,
      user.userId,
      user.role,
    );

    // Audit log for project deletion (non-blocking)
    await safeAuditLog(
      this.auditService,
      {
        userId: user.userId,
        action: AuditAction.PROJECT_DELETE,
        resourceType: 'project',
        resourceId: id,
        ipAddress,
        userAgent,
      },
      'project deletion',
    );

    return result;
  }

  // ===== Phase 1: Workflow Endpoints =====

  /**
   * Assign employees to a project
   */
  @Post(':id/employees')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Assign employees to project',
    description:
      'Assigns one or more employees to a project. Validates that employees are not already assigned to another active project.',
  })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({ status: 200, description: 'Employees assigned successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input or employee already assigned' })
  @ApiResponse({ status: 404, description: 'Project or employee not found' })
  async assignEmployees(
    @Param('id') projectId: string,
    @Body() assignEmployeesDto: AssignEmployeesDto,
    @CurrentUser() user: UserPayload,
    @IpAddress() ipAddress: string,
    @UserAgent() userAgent: string,
  ) {
    await this.projectEmployeeService.assignEmployeesToProject(
      projectId,
      assignEmployeesDto.employeeIds,
    );

    await safeAuditLog(
      this.auditService,
      {
        userId: user.userId,
        action: AuditAction.PROJECT_UPDATE,
        resourceType: 'project',
        resourceId: projectId,
        ipAddress,
        userAgent,
        details: {
          action: 'assign_employees',
          employeeCount: assignEmployeesDto.employeeIds.length,
          employeeIdsList: assignEmployeesDto.employeeIds.join(', '),
        },
      },
      'employee assignment',
    );

    return {
      message: 'Employees assigned successfully',
      projectId,
      employeeCount: assignEmployeesDto.employeeIds.length,
    };
  }

  /**
   * Remove employee from project
   */
  @Delete(':id/employees/:employeeId')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Remove employee from project',
    description: 'Removes an employee assignment from a project.',
  })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiParam({ name: 'employeeId', description: 'Employee ID to remove' })
  @ApiResponse({ status: 200, description: 'Employee removed successfully' })
  @ApiResponse({ status: 404, description: 'Assignment not found' })
  async removeEmployee(
    @Param('id') projectId: string,
    @Param('employeeId') employeeId: string,
    @CurrentUser() user: UserPayload,
    @IpAddress() ipAddress: string,
    @UserAgent() userAgent: string,
  ) {
    await this.projectEmployeeService.removeEmployeeFromProject(
      projectId,
      employeeId,
    );

    await safeAuditLog(
      this.auditService,
      {
        userId: user.userId,
        action: AuditAction.PROJECT_UPDATE,
        resourceType: 'project',
        resourceId: projectId,
        ipAddress,
        userAgent,
        details: {
          action: 'remove_employee',
          employeeId,
        },
      },
      'employee removal',
    );

    return {
      message: 'Employee removed successfully',
      projectId,
      employeeId,
    };
  }

  /**
   * Get project employees
   */
  @Get(':id/employees')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Get project employees',
    description: 'Returns all employees assigned to a project.',
  })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({ status: 200, description: 'Employees retrieved successfully' })
  async getProjectEmployees(@Param('id') projectId: string) {
    return this.projectEmployeeService.getProjectEmployees(projectId);
  }

  /**
   * Record payment for project
   */
  @Post(':id/payments')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Record payment for project',
    description:
      'Records a payment for a project. If payment completes the initial amount required, project will auto-activate.',
  })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({ status: 200, description: 'Payment recorded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid payment amount' })
  async recordPayment(
    @Param('id') projectId: string,
    @Body() recordPaymentDto: RecordPaymentDto,
    @CurrentUser() user: UserPayload,
    @IpAddress() ipAddress: string,
    @UserAgent() userAgent: string,
  ) {
    const result = await this.projectStatusService.updateProjectPayment(
      projectId,
      recordPaymentDto.amount,
    );

    await safeAuditLog(
      this.auditService,
      {
        userId: user.userId,
        action: AuditAction.PROJECT_UPDATE,
        resourceType: 'project',
        resourceId: projectId,
        ipAddress,
        userAgent,
        details: {
          action: 'record_payment',
          amount: recordPaymentDto.amount,
          notes: recordPaymentDto.notes ?? null,
          activated: result.activated,
        },
      },
      'payment recording',
    );

    return {
      message: result.activated
        ? 'Payment recorded and project activated'
        : 'Payment recorded successfully',
      project: result.project,
      activated: result.activated,
    };
  }

  /**
   * Activate project manually
   */
  @Post(':id/activate')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Activate project',
    description:
      'Manually activates a project. Checks payment requirements before activation.',
  })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({ status: 200, description: 'Project activated successfully' })
  @ApiResponse({
    status: 400,
    description: 'Payment requirements not met or invalid status',
  })
  async activateProject(
    @Param('id') projectId: string,
    @CurrentUser() user: UserPayload,
    @IpAddress() ipAddress: string,
    @UserAgent() userAgent: string,
  ) {
    const project = await this.projectStatusService.activateProject(projectId);

    await safeAuditLog(
      this.auditService,
      {
        userId: user.userId,
        action: AuditAction.PROJECT_UPDATE,
        resourceType: 'project',
        resourceId: projectId,
        ipAddress,
        userAgent,
        details: {
          action: 'activate_project',
        },
      },
      'project activation',
    );

    return {
      message: 'Project activated successfully',
      project,
    };
  }

  /**
   * Complete project
   */
  @Post(':id/complete')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Complete project',
    description: 'Marks an active project as completed.',
  })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({ status: 200, description: 'Project completed successfully' })
  @ApiResponse({ status: 400, description: 'Project must be ACTIVE to complete' })
  async completeProject(
    @Param('id') projectId: string,
    @CurrentUser() user: UserPayload,
    @IpAddress() ipAddress: string,
    @UserAgent() userAgent: string,
  ) {
    const project = await this.projectStatusService.completeProject(projectId);

    await safeAuditLog(
      this.auditService,
      {
        userId: user.userId,
        action: AuditAction.PROJECT_UPDATE,
        resourceType: 'project',
        resourceId: projectId,
        ipAddress,
        userAgent,
        details: {
          action: 'complete_project',
        },
      },
      'project completion',
    );

    return {
      message: 'Project completed successfully',
      project,
    };
  }

  /**
   * Archive project
   */
  @Post(':id/archive')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Archive project',
    description: 'Archives a completed project.',
  })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({ status: 200, description: 'Project archived successfully' })
  @ApiResponse({ status: 400, description: 'Project must be COMPLETED to archive' })
  async archiveProject(
    @Param('id') projectId: string,
    @CurrentUser() user: UserPayload,
    @IpAddress() ipAddress: string,
    @UserAgent() userAgent: string,
  ) {
    const project = await this.projectStatusService.archiveProject(projectId);

    await safeAuditLog(
      this.auditService,
      {
        userId: user.userId,
        action: AuditAction.PROJECT_UPDATE,
        resourceType: 'project',
        resourceId: projectId,
        ipAddress,
        userAgent,
        details: {
          action: 'archive_project',
        },
      },
      'project archival',
    );

    return {
      message: 'Project archived successfully',
      project,
    };
  }

  /**
   * Get project status summary
   */
  @Get(':id/status')
  @ApiOperation({
    summary: 'Get project status summary',
    description:
      'Returns detailed status information including payment progress and activation eligibility.',
  })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({ status: 200, description: 'Status summary retrieved successfully' })
  async getProjectStatus(@Param('id') projectId: string) {
    return this.projectStatusService.getProjectStatusSummary(projectId);
  }
}
