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
import { UsersService } from './users.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ToggleStatusDto } from './dto/toggle-status.dto';
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

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly auditService: AuditService,
  ) {}

  @Post()
  @Roles(Role.ADMIN)
  @Throttle({ default: RATE_LIMIT_USERS.CREATE })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createClientDto: CreateClientDto,
    @CurrentUser() user: UserPayload,
    @IpAddress() ipAddress: string,
    @UserAgent() userAgent: string,
  ) {
    const newUser = await this.usersService.createClient(createClientDto);

    // Audit log for user creation
    await this.auditService.log({
      userId: user.userId,
      action: AuditAction.USER_CREATE,
      resourceType: 'user',
      resourceId: newUser.id,
      ipAddress,
      userAgent,
      details: {
        email: createClientDto.email,
        firstName: createClientDto.firstName,
        lastName: createClientDto.lastName,
        role: 'CLIENT',
      },
    });

    return newUser;
  }

  @Get()
  @Roles(Role.ADMIN)
  findAll(@Query() paginationDto: PaginationDto) {
    return this.usersService.findAll(paginationDto);
  }

  @Get('profile')
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
  findOne(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    return this.usersService.findOne(id, user.userId, user.role);
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
    const updatedUser = await this.usersService.update(id, updateUserDto, user.userId, user.role);

    // Audit log for user update
    await this.auditService.log({
      userId: user.userId,
      action: AuditAction.USER_UPDATE,
      resourceType: 'user',
      resourceId: id,
      ipAddress,
      userAgent,
      details: {
        updatedFields: Object.keys(updateUserDto),
      },
    });

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
  @Roles(Role.ADMIN)
  @Throttle({ default: RATE_LIMIT_USERS.DELETE })
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: UserPayload,
    @IpAddress() ipAddress: string,
    @UserAgent() userAgent: string,
  ) {
    const result = await this.usersService.remove(id, user.userId);

    // Audit log for user deletion
    await this.auditService.log({
      userId: user.userId,
      action: AuditAction.USER_DELETE,
      resourceType: 'user',
      resourceId: id,
      ipAddress,
      userAgent,
    });

    return result;
  }
}
