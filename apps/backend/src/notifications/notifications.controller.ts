import { Controller, Get, Put, Param, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { UserPayload } from '../auth/interfaces/user.interface';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    @Get()
    @ApiOperation({ summary: 'Get my notifications' })
    findAll(@CurrentUser() user: UserPayload) {
        return this.notificationsService.findAllByUser(user.userId);
    }

    @Get('unread-count')
    @ApiOperation({ summary: 'Get unread count' })
    getUnreadCount(@CurrentUser() user: UserPayload) {
        return this.notificationsService.getUnreadCount(user.userId);
    }

    @Put(':id/read')
    @ApiOperation({ summary: 'Mark notification as read' })
    markAsRead(
        @CurrentUser() user: UserPayload,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        return this.notificationsService.markAsRead(id, user.userId);
    }

    @Put('read-all')
    @ApiOperation({ summary: 'Mark all as read' })
    markAllAsRead(@CurrentUser() user: UserPayload) {
        return this.notificationsService.markAllAsRead(user.userId);
    }
}
