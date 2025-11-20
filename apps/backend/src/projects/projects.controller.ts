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

@Controller('projects')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @Roles(Role.ADMIN)
  @Throttle({ default: RATE_LIMIT_PROJECTS.CREATE })
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createProjectDto: CreateProjectDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.projectsService.create(createProjectDto, user.userId);
  }

  @Get()
  findAll(
    @CurrentUser() user: UserPayload,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.projectsService.findAll(user.userId, user.role, paginationDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    return this.projectsService.findOne(id, user.userId, user.role);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @Throttle({ default: RATE_LIMIT_PROJECTS.UPDATE })
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
  remove(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    return this.projectsService.remove(id, user.userId, user.role);
  }
}
