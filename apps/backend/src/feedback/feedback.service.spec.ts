import { Test, TestingModule } from '@nestjs/testing';
import { FeedbackService } from './feedback.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';

describe('FeedbackService', () => {
  let service: FeedbackService;
  let prismaService: any;
  let notificationsService: any;

  const mockProjectId = 'project-123';
  const mockEmployeeId = 'employee-123';
  const mockCycleId = 'cycle-123';

  const mockCycle = {
    id: mockCycleId,
    projectId: mockProjectId,
    employeeId: mockEmployeeId,
    status: 'open',
    startDate: new Date(),
    project: {
      id: mockProjectId,
      name: 'Test Project',
      clientId: 'client-123',
    },
    employee: {
      id: mockEmployeeId,
      email: 'employee@test.com',
      firstName: 'Employee',
    },
    feedback: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeedbackService,
        {
          provide: PrismaService,
          useValue: {
            feedbackCycle: {
              findFirst: jest.fn(),
              create: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              findMany: jest.fn(),
            },
            feedback: {
              create: jest.fn(),
            },
            file: {
              update: jest.fn(),
              findMany: jest.fn().mockResolvedValue([]),
              updateMany: jest.fn(),
            },
            $transaction: jest.fn().mockImplementation((callback) => {
              // Execute the callback with a mock transaction that mirrors prisma
              const mockTx = {
                file: {
                  updateMany: jest.fn(),
                },
                feedbackCycle: {
                  update: jest
                    .fn()
                    .mockResolvedValue({ ...mockCycle, status: 'open' }),
                },
              };
              return callback(mockTx);
            }),
          },
        },
        {
          provide: NotificationsService,
          useValue: {
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<FeedbackService>(FeedbackService);
    prismaService = module.get<PrismaService>(PrismaService);
    notificationsService =
      module.get<NotificationsService>(NotificationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateStartDate', () => {
    it('should start today at 12PM if now is before 12PM', () => {
      const morning = new Date('2024-01-01T10:00:00');
      const result = service.calculateStartDate(morning);
      expect(result.getDate()).toBe(1);
      expect(result.getHours()).toBe(12);
    });

    it('should start tomorrow at 12PM if now is after 12PM', () => {
      const afternoon = new Date('2024-01-01T14:00:00');
      const result = service.calculateStartDate(afternoon);
      expect(result.getDate()).toBe(2);
      expect(result.getHours()).toBe(12);
    });
  });

  describe('createFeedbackCycle', () => {
    it('should return existing open cycle if one exists', async () => {
      prismaService.feedbackCycle.findFirst.mockResolvedValue(mockCycle);

      const result = await service.createFeedbackCycle(
        mockProjectId,
        mockEmployeeId,
      );

      expect(result).toEqual(mockCycle);
      expect(prismaService.feedbackCycle.create).not.toHaveBeenCalled();
    });

    it('should create new cycle if no open cycle exists', async () => {
      prismaService.feedbackCycle.findFirst.mockResolvedValue(null);
      prismaService.feedbackCycle.create.mockResolvedValue(mockCycle);

      const result = await service.createFeedbackCycle(
        mockProjectId,
        mockEmployeeId,
      );

      expect(result).toEqual(mockCycle);
      expect(prismaService.feedbackCycle.create).toHaveBeenCalled();
      expect(notificationsService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockEmployeeId,
          type: NotificationType.INFO,
        }),
      );
    });
  });

  describe('addFeedbackToCycle', () => {
    it('should add feedback to existing cycle', async () => {
      prismaService.feedbackCycle.findFirst.mockResolvedValue(mockCycle);
      const feedbackEntry = { id: 'fb-1', content: 'Good job' };
      prismaService.feedback.create.mockResolvedValue(feedbackEntry);

      const result = await service.addFeedbackToCycle(
        mockProjectId,
        mockEmployeeId,
        'admin-1',
        'employee_space',
        'Good job',
      );

      expect(result).toEqual(feedbackEntry);
      expect(prismaService.feedback.create).toHaveBeenCalled();
      expect(notificationsService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockEmployeeId, // Target audience is employee
          type: NotificationType.WARNING,
        }),
      );
    });

    it('should create new cycle if none exists and then add feedback', async () => {
      prismaService.feedbackCycle.findFirst.mockResolvedValue(null);
      // Mock createFeedbackCycle behavior
      prismaService.feedbackCycle.create.mockResolvedValue(mockCycle);
      // After create, it refetches
      prismaService.feedbackCycle.findUnique.mockResolvedValue(mockCycle);

      prismaService.feedback.create.mockResolvedValue({ id: 'fb-1' });

      await service.addFeedbackToCycle(
        mockProjectId,
        mockEmployeeId,
        'admin-1',
        'employee_space',
      );

      expect(prismaService.feedbackCycle.create).toHaveBeenCalled();
      expect(prismaService.feedback.create).toHaveBeenCalled();
    });
  });

  describe('submitFeedbackCycle', () => {
    it('should submit open cycle', async () => {
      prismaService.feedbackCycle.findUnique.mockResolvedValue(mockCycle);
      const submittedCycle = { ...mockCycle, status: 'submitted' };
      prismaService.feedbackCycle.update.mockResolvedValue(submittedCycle);

      const result = await service.submitFeedbackCycle(mockCycleId, 'file-123');

      expect(result.status).toBe('submitted');
      expect(prismaService.file.update).toHaveBeenCalledWith({
        where: { id: 'file-123' },
        data: { feedbackCycleId: mockCycleId },
      });
      expect(notificationsService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockCycle.project.clientId,
          type: NotificationType.SUCCESS,
        }),
      );
    });

    it('should throw BadRequest if cycle is not open', async () => {
      prismaService.feedbackCycle.findUnique.mockResolvedValue({
        ...mockCycle,
        status: 'submitted',
      });

      await expect(
        service.submitFeedbackCycle(mockCycleId, 'file-123'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('approveFeedbackCycle', () => {
    it('should approve submitted cycle', async () => {
      const submittedCycle = { ...mockCycle, status: 'submitted' };
      prismaService.feedbackCycle.findUnique.mockResolvedValue(submittedCycle);

      // Mock that there's at least one file in SUBMITTED stage
      prismaService.file.findMany.mockResolvedValue([{ id: 'file-1' }]);

      const approvedCycle = {
        ...mockCycle,
        status: 'approved',
        employee: { id: mockEmployeeId },
        project: { id: mockProjectId, name: 'Test Project' },
      };

      // Mock $transaction to return approved cycle
      prismaService.$transaction.mockImplementation(
        (callback: (tx: unknown) => unknown) => {
          const mockTx = {
            file: { updateMany: jest.fn() },
            feedbackCycle: {
              update: jest.fn().mockResolvedValue(approvedCycle),
            },
          };
          return Promise.resolve(callback(mockTx));
        },
      );

      const result = await service.approveFeedbackCycle(mockCycleId);

      expect(result.status).toBe('approved');
      expect(notificationsService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockEmployeeId,
          type: NotificationType.SUCCESS,
        }),
      );
    });

    it('should throw BadRequest if cycle is not submitted', async () => {
      prismaService.feedbackCycle.findUnique.mockResolvedValue({
        ...mockCycle,
        status: 'open',
      });

      await expect(service.approveFeedbackCycle(mockCycleId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequest if no files in SUBMITTED stage', async () => {
      const submittedCycle = { ...mockCycle, status: 'submitted' };
      prismaService.feedbackCycle.findUnique.mockResolvedValue(submittedCycle);
      prismaService.file.findMany.mockResolvedValue([]); // No files

      await expect(service.approveFeedbackCycle(mockCycleId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('rejectFeedbackCycle', () => {
    it('should reject submitted cycle and reopen it', async () => {
      const submittedCycle = { ...mockCycle, status: 'submitted' };
      prismaService.feedbackCycle.findUnique.mockResolvedValue(submittedCycle);

      const openCycle = {
        ...mockCycle,
        status: 'open',
        employee: { id: mockEmployeeId },
        project: { id: mockProjectId, name: 'Test Project' },
      };

      // Mock $transaction to return reopened cycle
      prismaService.$transaction.mockImplementation(
        (callback: (tx: unknown) => unknown) => {
          const mockTx = {
            file: { updateMany: jest.fn() },
            feedbackCycle: { update: jest.fn().mockResolvedValue(openCycle) },
          };
          return Promise.resolve(callback(mockTx));
        },
      );

      const result = await service.rejectFeedbackCycle(mockCycleId);

      expect(result.status).toBe('open');
      expect(notificationsService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockEmployeeId,
          type: NotificationType.WARNING,
        }),
      );
    });
  });
});
