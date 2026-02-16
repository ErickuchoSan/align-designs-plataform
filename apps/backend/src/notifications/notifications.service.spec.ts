import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { NotificationType } from '@prisma/client';
import { CreateNotificationDto } from './dto/create-notification.dto';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prismaService: PrismaService;
  let emailService: EmailService;

  const mockUserId = 'user-123';
  const mockNotificationId = 'notification-456';

  const mockUser = {
    id: mockUserId,
    email: 'test@example.com',
    firstName: 'Test',
  };

  const mockNotification = {
    id: mockNotificationId,
    userId: mockUserId,
    type: NotificationType.INFO,
    title: 'Test Notification',
    message: 'This is a test message',
    link: '/dashboard',
    read: false,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: PrismaService,
          useValue: {
            notification: {
              create: jest.fn(),
              findMany: jest.fn(),
              count: jest.fn(),
              updateMany: jest.fn(),
            },
            user: {
              findUnique: jest.fn(),
            },
          },
        },
        {
          provide: EmailService,
          useValue: {
            sendNotificationEmail: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    prismaService = module.get<PrismaService>(PrismaService);
    emailService = module.get<EmailService>(EmailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto: CreateNotificationDto = {
      userId: mockUserId,
      type: NotificationType.INFO,
      title: 'Test Notification',
      message: 'This is a test message',
      link: '/dashboard',
    };

    it('should create notification and send email when user has email', async () => {
      jest
        .spyOn(prismaService.notification, 'create')
        .mockResolvedValue(mockNotification);
      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(mockUser as any);
      jest.spyOn(emailService, 'sendNotificationEmail').mockResolvedValue();

      const result = await service.create(createDto);

      expect(result).toEqual(mockNotification);
      expect(prismaService.notification.create).toHaveBeenCalledWith({
        data: {
          userId: createDto.userId,
          type: NotificationType.INFO,
          title: createDto.title,
          message: createDto.message,
          link: createDto.link,
        },
      });
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: createDto.userId },
        select: { email: true, firstName: true },
      });
      expect(emailService.sendNotificationEmail).toHaveBeenCalledWith(
        mockUser.email,
        createDto.title,
        createDto.title,
        createDto.message,
        createDto.link,
        'Go to Platform',
      );
    });

    it('should create notification without sending email when user has no email', async () => {
      const userWithoutEmail = { ...mockUser, email: null };
      jest
        .spyOn(prismaService.notification, 'create')
        .mockResolvedValue(mockNotification);
      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(userWithoutEmail as any);

      const result = await service.create(createDto);

      expect(result).toEqual(mockNotification);
      expect(emailService.sendNotificationEmail).not.toHaveBeenCalled();
    });

    it('should create notification without sending email when user not found', async () => {
      jest
        .spyOn(prismaService.notification, 'create')
        .mockResolvedValue(mockNotification);
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      const result = await service.create(createDto);

      expect(result).toEqual(mockNotification);
      expect(emailService.sendNotificationEmail).not.toHaveBeenCalled();
    });

    it('should use INFO type when type is not provided', async () => {
      const dtoWithoutType: CreateNotificationDto = {
        userId: mockUserId,
        title: 'Test',
        message: 'Message',
      };

      jest
        .spyOn(prismaService.notification, 'create')
        .mockResolvedValue(mockNotification);
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      await service.create(dtoWithoutType);

      expect(prismaService.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: NotificationType.INFO,
        }),
      });
    });

    it('should return null and log error when creation fails', async () => {
      jest
        .spyOn(prismaService.notification, 'create')
        .mockRejectedValue(new Error('Database error'));

      const result = await service.create(createDto);

      expect(result).toBeNull();
    });
  });

  describe('findAllByUser', () => {
    it('should return last 50 notifications for user ordered by createdAt desc', async () => {
      const notifications = [mockNotification, { ...mockNotification, id: 'notification-789' }];
      jest
        .spyOn(prismaService.notification, 'findMany')
        .mockResolvedValue(notifications);

      const result = await service.findAllByUser(mockUserId);

      expect(result).toEqual(notifications);
      expect(prismaService.notification.findMany).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
    });

    it('should return empty array when no notifications exist', async () => {
      jest.spyOn(prismaService.notification, 'findMany').mockResolvedValue([]);

      const result = await service.findAllByUser(mockUserId);

      expect(result).toEqual([]);
    });
  });

  describe('getUnreadCount', () => {
    it('should return count of unread notifications', async () => {
      jest.spyOn(prismaService.notification, 'count').mockResolvedValue(5);

      const result = await service.getUnreadCount(mockUserId);

      expect(result).toBe(5);
      expect(prismaService.notification.count).toHaveBeenCalledWith({
        where: { userId: mockUserId, read: false },
      });
    });

    it('should return 0 when no unread notifications', async () => {
      jest.spyOn(prismaService.notification, 'count').mockResolvedValue(0);

      const result = await service.getUnreadCount(mockUserId);

      expect(result).toBe(0);
    });
  });

  describe('markAsRead', () => {
    it('should mark single notification as read', async () => {
      const updateResult = { count: 1 };
      jest
        .spyOn(prismaService.notification, 'updateMany')
        .mockResolvedValue(updateResult);

      const result = await service.markAsRead(mockNotificationId, mockUserId);

      expect(result).toEqual(updateResult);
      expect(prismaService.notification.updateMany).toHaveBeenCalledWith({
        where: { id: mockNotificationId, userId: mockUserId },
        data: { read: true },
      });
    });

    it('should return count 0 when notification not found or not owned by user', async () => {
      const updateResult = { count: 0 };
      jest
        .spyOn(prismaService.notification, 'updateMany')
        .mockResolvedValue(updateResult);

      const result = await service.markAsRead('wrong-id', mockUserId);

      expect(result.count).toBe(0);
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all unread notifications as read for user', async () => {
      const updateResult = { count: 5 };
      jest
        .spyOn(prismaService.notification, 'updateMany')
        .mockResolvedValue(updateResult);

      const result = await service.markAllAsRead(mockUserId);

      expect(result).toEqual(updateResult);
      expect(prismaService.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: mockUserId, read: false },
        data: { read: true },
      });
    });

    it('should return count 0 when no unread notifications exist', async () => {
      const updateResult = { count: 0 };
      jest
        .spyOn(prismaService.notification, 'updateMany')
        .mockResolvedValue(updateResult);

      const result = await service.markAllAsRead(mockUserId);

      expect(result.count).toBe(0);
    });
  });
});
