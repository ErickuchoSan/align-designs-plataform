import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Put,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UserAnalyticsService } from './services/user-analytics.service';
import { CreateClientDto } from './dto/create-client.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ToggleStatusDto } from './dto/toggle-status.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { IpAddress } from '../auth/decorators/ip-address.decorator';
import { UserAgent } from '../auth/decorators/user-agent.decorator';
import { Role } from '@prisma/client';
import type { UserPayload } from '../auth/interfaces/user.interface';
import { PaginationDto } from '../common/dto/pagination.dto';
import { RATE_LIMIT_USERS } from '../common/constants/timeouts.constants';
import { AuditService, AuditAction } from '../audit/audit.service';
import { safeAuditLog } from '../audit/audit.helper';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly userAnalyticsService: UserAnalyticsService,
    private readonly auditService: AuditService,
  ) { }

  @Post()
  @ApiOperation({
    summary: 'Create new user',
    description: 'Admin-only: Create a new user (client or employee)',
  })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or email already exists',
  })
  @Roles(Role.ADMIN)
  @Throttle({ default: RATE_LIMIT_USERS.CREATE })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createUserDto: CreateUserDto,
    @CurrentUser() user: UserPayload,
    @IpAddress() ipAddress: string,
    @UserAgent() userAgent: string,
  ) {
    const newUser = await this.usersService.createUser(createUserDto);

    if (!newUser) {
      throw new Error('Failed to create user');
    }

    // Audit log for user creation (non-blocking)
    await safeAuditLog(
      this.auditService,
      {
        userId: user.userId,
        action: AuditAction.USER_CREATE,
        resourceType: 'user',
        resourceId: newUser.id,
        ipAddress,
        userAgent,
        details: {
          email: createUserDto.email,
          firstName: createUserDto.firstName,
          lastName: createUserDto.lastName,
          role: createUserDto.role,
        },
      },
      'user creation',
    );

    return newUser;
  }

  @Get()
  @ApiOperation({
    summary: 'Get all users',
    description: 'Admin-only: Retrieve paginated list of all users',
  })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  @Roles(Role.ADMIN)
  @Throttle({ default: RATE_LIMIT_USERS.LIST })
  findAll(@Query() queryDto: QueryUsersDto) {
    return this.usersService.findAll(queryDto, queryDto.role);
  }

  @Get('available-employees')
  @ApiOperation({
    summary: 'Get available employees',
    description: 'Admin-only: Get employees not assigned to any active project',
  })
  @ApiResponse({
    status: 200,
    description: 'Available employees retrieved successfully',
  })
  @Roles(Role.ADMIN)
  @Throttle({ default: RATE_LIMIT_USERS.LIST })
  getAvailableEmployees(@Query() paginationDto: PaginationDto) {
    return this.usersService.findAvailableEmployees(paginationDto);
  }

  @Get('profile')
  @ApiOperation({
    summary: 'Get current user profile',
    description: 'Retrieve the profile of the currently authenticated user',
  })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  @Throttle({ default: RATE_LIMIT_USERS.GET_PROFILE })
  getProfile(@CurrentUser() user: UserPayload) {
    return this.usersService.findOne(user.userId, user.userId, user.role);
  }

  @Put('profile')
  @Throttle({ default: RATE_LIMIT_USERS.UPDATE })
  @HttpCode(HttpStatus.OK)
  updateProfile(
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.usersService.update(
      user.userId,
      updateUserDto,
      user.userId,
      user.role,
    );
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get user by ID',
    description: 'Retrieve a specific user by their ID',
  })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Throttle({ default: RATE_LIMIT_USERS.GET })
  findOne(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    return this.usersService.findOne(id, user.userId, user.role);
  }

  @Get(':id/analytics')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Get client analytics',
    description: 'Get comprehensive analytics for a specific client (Admin only)',
  })
  @ApiParam({ name: 'id', description: 'Client UUID' })
  @ApiResponse({ status: 200, description: 'Analytics retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  @Throttle({ default: RATE_LIMIT_USERS.GET })
  getClientAnalytics(@Param('id') id: string) {
    return this.userAnalyticsService.getClientAnalytics(id);
  }

  @Get(':id/analytics/distribution')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Get project distribution for client',
    description: 'Get project distribution by status for chart visualization (Admin only)',
  })
  @ApiParam({ name: 'id', description: 'Client UUID' })
  @ApiResponse({ status: 200, description: 'Distribution data retrieved successfully' })
  @Throttle({ default: RATE_LIMIT_USERS.GET })
  getProjectDistribution(@Param('id') id: string) {
    return this.userAnalyticsService.getProjectDistribution(id);
  }

  @Get(':id/analytics/monthly')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Get monthly activity for client',
    description: 'Get monthly project activity for the last 12 months (Admin only)',
  })
  @ApiParam({ name: 'id', description: 'Client UUID' })
  @ApiResponse({ status: 200, description: 'Monthly activity data retrieved successfully' })
  @Throttle({ default: RATE_LIMIT_USERS.GET })
  getMonthlyActivity(@Param('id') id: string) {
    return this.userAnalyticsService.getMonthlyActivity(id);
  }

  @Patch(':id')
  @Throttle({ default: RATE_LIMIT_USERS.UPDATE })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() user: UserPayload,
    @IpAddress() ipAddress: string,
    @UserAgent() userAgent: string,
  ) {
    const updatedUser = await this.usersService.update(
      id,
      updateUserDto,
      user.userId,
      user.role,
    );

    // Audit log for user update (non-blocking)
    await safeAuditLog(
      this.auditService,
      {
        userId: user.userId,
        action: AuditAction.USER_UPDATE,
        resourceType: 'user',
        resourceId: id,
        ipAddress,
        userAgent,
        details: {
          updatedFields: Object.keys(updateUserDto).join(', '),
        },
      },
      'user update',
    );

    return updatedUser;
  }

  @Patch(':id/toggle-status')
  @Roles(Role.ADMIN)
  @Throttle({ default: RATE_LIMIT_USERS.TOGGLE_STATUS })
  @HttpCode(HttpStatus.OK)
  toggleStatus(
    @Param('id') id: string,
    @Body() toggleStatusDto: ToggleStatusDto,
  ) {
    return this.usersService.toggleStatus(id, toggleStatusDto.isActive);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete user',
    description: 'Admin-only: Soft delete a user account',
  })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Roles(Role.ADMIN)
  @Throttle({ default: RATE_LIMIT_USERS.DELETE })
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id') id: string,
    @Query('hard') hard: boolean,
    @CurrentUser() user: UserPayload,
    @IpAddress() ipAddress: string,
    @UserAgent() userAgent: string,
  ) {
    // Convert string 'true' to boolean if necessary (NestJS ParseBoolPipe is better but this works for now)
    const isHardDelete = hard === true || String(hard) === 'true';
    const result = await this.usersService.remove(id, user.userId, isHardDelete);

    // Audit log for user deletion (non-blocking)
    await safeAuditLog(
      this.auditService,
      {
        userId: user.userId,
        action: AuditAction.USER_DELETE,
        resourceType: 'user',
        resourceId: id,
        ipAddress,
        userAgent,
      },
      'user deletion',
    );

    return result;
  }
}
