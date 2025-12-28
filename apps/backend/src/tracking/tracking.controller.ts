import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { TimeTrackingService } from './time-tracking.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('tracking')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TrackingController {
    constructor(private readonly trackingService: TimeTrackingService) { }

    @Get('project/:projectId')
    @Roles(Role.ADMIN, Role.CLIENT) // Clients can see tracking? Plan says Admin Dashboard. Maybe Client too for transparency? Let's allow Admin for now.
    @Roles(Role.ADMIN)
    async getProjectStats(@Param('projectId') projectId: string) {
        return this.trackingService.getProjectStats(projectId);
    }
}
