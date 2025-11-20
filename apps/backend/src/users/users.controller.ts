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
import { Role } from '@prisma/client';
import type { UserPayload } from '../auth/interfaces/user.interface';
import { PaginationDto } from '../common/dto/pagination.dto';
import { RATE_LIMIT_USERS } from '../common/constants/timeouts.constants';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(Role.ADMIN)
  @Throttle({ default: RATE_LIMIT_USERS.CREATE })
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createClientDto: CreateClientDto) {
    return this.usersService.createClient(createClientDto);
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
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.usersService.update(id, updateUserDto, user.userId, user.role);
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
  remove(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    return this.usersService.remove(id, user.userId);
  }
}
