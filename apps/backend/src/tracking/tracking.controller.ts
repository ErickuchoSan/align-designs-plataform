import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { TimeTrackingService } from './time-tracking.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import type { UserPayload } from '../auth/interfaces/user.interface';

@Controller('tracking')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TrackingController {
  constructor(private readonly trackingService: TimeTrackingService) {}

  @Get('project/:projectId')
  @Roles(Role.ADMIN, Role.EMPLOYEE) // Admin and employees can see project tracking stats
  async getProjectStats(
    @Param('projectId') projectId: string,
    @CurrentUser() user: UserPayload,
  ) {
    return this.trackingService.getProjectStats(
      projectId,
      user.userId,
      user.role,
    );
  }
}
