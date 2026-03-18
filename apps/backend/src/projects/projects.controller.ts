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
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import {
  ApiProjectIdParam,
  ApiAdminWriteResponses,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiSuccessResponse,
  ApiCreatedResponse,
  ApiProjectWorkflowResponses,
  ApiForbiddenResponse,
  ApiAdminProjectEndpoint,
} from '../common/decorators/api-responses.decorator';
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
import {
  AuditService,
  AuditAction,
  AuditDetailsValue,
} from '../audit/audit.service';
import { safeAuditLog } from '../audit/audit.helper';
import { ProjectEmployeeService } from './services/project-employee.service';
import { ProjectStatusService } from './services/project-status.service';
import { AssignEmployeesDto } from './dto/assign-employees.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';

interface AuditContext {
  user: UserPayload;
  ipAddress: string;
  userAgent: string;
}

@ApiTags('projects')
@ApiBearerAuth('JWT-auth')
@Controller('projects')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProjectsController {
  private readonly logger = new Logger(ProjectsController.name);

  constructor(
    private readonly projectsService: ProjectsService,
    private readonly auditService: AuditService,
    private readonly projectEmployeeService: ProjectEmployeeService,
    private readonly projectStatusService: ProjectStatusService,
  ) {}

  /**
   * Helper to create audit log with common project fields
   */
  private async auditProjectAction(
    ctx: AuditContext,
    action: AuditAction,
    projectId: string,
    description: string,
    details?: Record<string, AuditDetailsValue>,
  ): Promise<void> {
    await safeAuditLog(
      this.auditService,
      {
        userId: ctx.user.userId,
        action,
        resourceType: 'project',
        resourceId: projectId,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        details,
      },
      description,
    );
  }

  @Post()
  @Roles(Role.ADMIN)
  @Throttle({ default: RATE_LIMIT_PROJECTS.CREATE })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new project',
    description: 'Creates a new project. Only accessible by admins.',
  })
  @ApiCreatedResponse('Project successfully created')
  @ApiAdminWriteResponses()
  async create(
    @Body() createProjectDto: CreateProjectDto,
    @CurrentUser() user: UserPayload,
    @IpAddress() ipAddress: string,
    @UserAgent() userAgent: string,
  ) {
    // Log project creation for debugging
    this.logger.debug('Creating new project', {
      name: createProjectDto.name,
      clientId: createProjectDto.clientId,
      hasEmployees: !!createProjectDto.employeeIds?.length,
      userId: user.userId,
    });

    const project = await this.projectsService.create(
      createProjectDto,
      user.userId,
    );

    if (!project) {
      throw new Error('Failed to create project');
    }

    // Audit log for project creation (non-blocking)
    await this.auditProjectAction(
      { user, ipAddress, userAgent },
      AuditAction.PROJECT_CREATE,
      project.id,
      'project creation',
      { name: createProjectDto.name, clientId: createProjectDto.clientId },
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
  @ApiSuccessResponse('Projects retrieved successfully')
  @ApiUnauthorizedResponse()
  findAll(
    @CurrentUser() user: UserPayload,
    @Query() paginationDto: PaginationDto,
    @Query('clientId') clientId?: string,
  ) {
    return this.projectsService.findAll(
      user.userId,
      user.role,
      paginationDto,
      clientId,
    );
  }

  @Get(':id')
  @Throttle({ default: RATE_LIMIT_PROJECTS.GET })
  @ApiOperation({
    summary: 'Get project by ID',
    description: 'Retrieves a single project by ID',
  })
  @ApiProjectIdParam()
  @ApiSuccessResponse('Project retrieved successfully')
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse('Forbidden - No access to this project')
  @ApiNotFoundResponse('Project')
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
  @ApiAdminProjectEndpoint('Project successfully updated')
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
    await this.auditProjectAction(
      { user, ipAddress, userAgent },
      AuditAction.PROJECT_UPDATE,
      id,
      'project update',
      { updatedFields: Object.keys(updateProjectDto).join(', ') },
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
  @ApiAdminProjectEndpoint('Project successfully deleted')
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
    await this.auditProjectAction(
      { user, ipAddress, userAgent },
      AuditAction.PROJECT_DELETE,
      id,
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
  @ApiProjectIdParam()
  @ApiSuccessResponse('Employees assigned successfully')
  @ApiBadRequestResponse('Invalid input or employee already assigned')
  @ApiNotFoundResponse('Project or employee')
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

    await this.auditProjectAction(
      { user, ipAddress, userAgent },
      AuditAction.PROJECT_UPDATE,
      projectId,
      'employee assignment',
      {
        action: 'assign_employees',
        employeeCount: assignEmployeesDto.employeeIds.length,
        employeeIdsList: assignEmployeesDto.employeeIds.join(', '),
      },
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
  @ApiProjectIdParam()
  @ApiParam({ name: 'employeeId', description: 'Employee ID to remove' })
  @ApiSuccessResponse('Employee removed successfully')
  @ApiNotFoundResponse('Assignment')
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

    await this.auditProjectAction(
      { user, ipAddress, userAgent },
      AuditAction.PROJECT_UPDATE,
      projectId,
      'employee removal',
      { action: 'remove_employee', employeeId },
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
  @ApiProjectIdParam()
  @ApiSuccessResponse('Employees retrieved successfully')
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
  @ApiProjectIdParam()
  @ApiSuccessResponse('Payment recorded successfully')
  @ApiBadRequestResponse('Invalid payment amount')
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

    await this.auditProjectAction(
      { user, ipAddress, userAgent },
      AuditAction.PROJECT_UPDATE,
      projectId,
      'payment recording',
      {
        action: 'record_payment',
        amount: recordPaymentDto.amount,
        notes: recordPaymentDto.notes ?? null,
        activated: result.activated,
      },
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
  @ApiProjectIdParam()
  @ApiProjectWorkflowResponses(
    'Project activated successfully',
    'Payment requirements not met or invalid status',
  )
  async activateProject(
    @Param('id') projectId: string,
    @CurrentUser() user: UserPayload,
    @IpAddress() ipAddress: string,
    @UserAgent() userAgent: string,
  ) {
    const project = await this.projectStatusService.activateProject(projectId);

    await this.auditProjectAction(
      { user, ipAddress, userAgent },
      AuditAction.PROJECT_UPDATE,
      projectId,
      'project activation',
      { action: 'activate_project' },
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
  @ApiProjectIdParam()
  @ApiProjectWorkflowResponses(
    'Project completed successfully',
    'Project must be ACTIVE to complete',
  )
  async completeProject(
    @Param('id') projectId: string,
    @CurrentUser() user: UserPayload,
    @IpAddress() ipAddress: string,
    @UserAgent() userAgent: string,
  ) {
    const project = await this.projectStatusService.completeProject(projectId);

    await this.auditProjectAction(
      { user, ipAddress, userAgent },
      AuditAction.PROJECT_UPDATE,
      projectId,
      'project completion',
      { action: 'complete_project' },
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
  @ApiProjectIdParam()
  @ApiProjectWorkflowResponses(
    'Project archived successfully',
    'Project must be COMPLETED to archive',
  )
  async archiveProject(
    @Param('id') projectId: string,
    @CurrentUser() user: UserPayload,
    @IpAddress() ipAddress: string,
    @UserAgent() userAgent: string,
  ) {
    const project = await this.projectStatusService.archiveProject(projectId);

    await this.auditProjectAction(
      { user, ipAddress, userAgent },
      AuditAction.PROJECT_UPDATE,
      projectId,
      'project archival',
      { action: 'archive_project' },
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
  @ApiProjectIdParam()
  @ApiSuccessResponse('Status summary retrieved successfully')
  async getProjectStatus(@Param('id') projectId: string) {
    return this.projectStatusService.getProjectStatusSummary(projectId);
  }

  /**
   * Get completion checklist
   */
  @Get(':id/completion-status')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Get completion checklist',
    description: 'Returns the checklist for project completion/archiving',
  })
  async getCompletionStatus(@Param('id') projectId: string) {
    return this.projectsService.getCompletionStatus(projectId);
  }

  /**
   * Get accessible stages for current user
   */
  @Get(':id/stages')
  @ApiOperation({
    summary: 'Get accessible project stages',
    description:
      'Returns stages that the current user can access based on their role and permissions',
  })
  @ApiProjectIdParam()
  @ApiSuccessResponse('Stages retrieved successfully')
  async getProjectStages(
    @Param('id') projectId: string,
    @CurrentUser() user: UserPayload,
  ) {
    return this.projectsService.getAccessibleStages(
      projectId,
      user.role,
      user.userId,
    );
  }

  /**
   * Check if project has data before deletion
   */
  @Get(':id/deletion-check')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Check project deletion safety',
    description:
      'Returns information about project data to warn admin before deletion',
  })
  @ApiProjectIdParam()
  @ApiSuccessResponse('Deletion check completed')
  async checkProjectDeletion(@Param('id') projectId: string) {
    return this.projectsService.checkProjectDeletionSafety(projectId);
  }

  /**
   * Close project brief (Admin action)
   * Locks the brief section and allows employees to start uploading files
   */
  @Post(':id/close-brief')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Close project brief',
    description:
      'Admin closes the project brief, locking the section and allowing employees to start work. May auto-activate the project if payment is complete.',
  })
  @ApiProjectIdParam()
  @ApiSuccessResponse('Brief closed successfully')
  @ApiBadRequestResponse('Brief already closed')
  @ApiNotFoundResponse('Project')
  async closeBrief(
    @Param('id') projectId: string,
    @CurrentUser() user: UserPayload,
    @IpAddress() ipAddress: string,
    @UserAgent() userAgent: string,
  ) {
    const result = await this.projectsService.closeBrief(projectId);

    await this.auditProjectAction(
      { user, ipAddress, userAgent },
      AuditAction.PROJECT_UPDATE,
      projectId,
      'brief closed',
      { action: 'close_brief' },
    );

    return {
      message: 'Project brief closed successfully',
      project: result.project,
      closedAt: result.project.briefApprovedAt,
      activated: result.activated,
    };
  }
}
