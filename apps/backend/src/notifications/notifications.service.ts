import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationType } from '@prisma/client';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Create a notification (DB + Email)
   */
  async create(createDto: CreateNotificationDto) {
    try {
      // 1. Create in DB
      const notification = await this.prisma.notification.create({
        data: {
          userId: createDto.userId,
          type: createDto.type || NotificationType.INFO,
          title: createDto.title,
          message: createDto.message,
          link: createDto.link,
        },
      });

      // 2. Send Email (Fire and forget, handled inside Service)
      // Check if user has email
      const user = await this.prisma.user.findUnique({
        where: { id: createDto.userId },
        select: { email: true, firstName: true },
      });

      if (user?.email) {
        // Construct email subject and body
        const subject = createDto.title; // Simplified
        await this.emailService.sendNotificationEmail(
          user.email,
          subject,
          createDto.title,
          createDto.message,
          createDto.link,
          'Go to Platform',
        );
      }

      return notification;
    } catch (error) {
      this.logger.error('Error creating notification', error);
      // Don't throw, just log
      return null;
    }
  }

  /**
   * Get all notifications for a user
   */
  async findAllByUser(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50, // Limit to last 50
    });
  }

  /**
   * Get unread count
   */
  async getUnreadCount(userId: string) {
    return this.prisma.notification.count({
      where: { userId, read: false },
    });
  }

  /**
   * Mark as read
   */
  async markAsRead(id: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data: { read: true },
    });
  }

  /**
   * Mark all as read
   */
  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  }
}
