import { Controller, Get, Post, Put, Body, Param, UseGuards, Request } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    @Get()
    @ApiOperation({ summary: 'Get my notifications' })
    findAll(@Request() req: any) {
        return this.notificationsService.findAllByUser(req.user.id);
    }

    @Get('unread-count')
    @ApiOperation({ summary: 'Get unread count' })
    getUnreadCount(@Request() req: any) {
        return this.notificationsService.getUnreadCount(req.user.id);
    }

    @Put(':id/read')
    @ApiOperation({ summary: 'Mark notification as read' })
    markAsRead(@Request() req: any, @Param('id') id: string) {
        return this.notificationsService.markAsRead(id, req.user.id);
    }

    @Put('read-all')
    @ApiOperation({ summary: 'Mark all as read' })
    markAllAsRead(@Request() req: any) {
        return this.notificationsService.markAllAsRead(req.user.id);
    }
}
