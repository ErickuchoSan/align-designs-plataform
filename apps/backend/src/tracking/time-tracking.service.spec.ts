import { Test, TestingModule } from '@nestjs/testing';
import { TimeTrackingService } from './time-tracking.service';
import { PrismaService } from '../prisma/prisma.service';

describe('TimeTrackingService', () => {
  let service: TimeTrackingService;
  let prismaService: any;

  const mockProjectId = 'project-123';
  const mockEmployeeId = 'employee-123';
  const mockCycleId = 'cycle-123';
  const mockTrackingId = 'tracking-123';

  const mockTimeTracking = {
    id: mockTrackingId,
    projectId: mockProjectId,
    employeeId: mockEmployeeId,
    feedbackCycleId: mockCycleId,
    startTime: new Date('2024-01-01T14:00:00'),
    endTime: null,
    durationDays: null,
    approvedFileId: null,
  };

  const mockProject = {
    id: mockProjectId,
    name: 'Test Project',
    status: 'ACTIVE',
    createdAt: new Date('2024-01-01T00:00:00'),
    updatedAt: new Date('2024-01-10T00:00:00'),
    employees: [{ employeeId: mockEmployeeId }],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TimeTrackingService,
        {
          provide: PrismaService,
          useValue: {
            timeTracking: {
              findFirst: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              findMany: jest.fn(),
            },
            project: {
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<TimeTrackingService>(TimeTrackingService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('startTracking', () => {
    it('should create new tracking when none exists', async () => {
      prismaService.timeTracking.findFirst.mockResolvedValue(null);
      prismaService.timeTracking.create.mockResolvedValue(mockTimeTracking);

      const result = await service.startTracking(
        mockProjectId,
        mockEmployeeId,
        mockCycleId,
        new Date('2024-01-01T14:00:00'),
      );

      expect(result).toEqual(mockTimeTracking);
      expect(prismaService.timeTracking.create).toHaveBeenCalled();
    });

    it('should return existing tracking if already active', async () => {
      prismaService.timeTracking.findFirst.mockResolvedValue(mockTimeTracking);

      const result = await service.startTracking(
        mockProjectId,
        mockEmployeeId,
        mockCycleId,
      );

      expect(result).toEqual(mockTimeTracking);
      expect(prismaService.timeTracking.create).not.toHaveBeenCalled();
    });

    it('should apply 12PM rule - before 12PM starts next day at 9AM', async () => {
      prismaService.timeTracking.findFirst.mockResolvedValue(null);
      prismaService.timeTracking.create.mockImplementation(async (args) => ({
        ...mockTimeTracking,
        startTime: args.data.startTime,
      }));

      const morningTime = new Date('2024-01-01T10:00:00');
      const result = await service.startTracking(
        mockProjectId,
        mockEmployeeId,
        mockCycleId,
        morningTime,
      );

      // Should start next day at 9AM
      expect(result.startTime.getDate()).toBe(2);
      expect(result.startTime.getHours()).toBe(9);
    });

    it('should apply 12PM rule - after 12PM starts immediately', async () => {
      prismaService.timeTracking.findFirst.mockResolvedValue(null);
      prismaService.timeTracking.create.mockImplementation(async (args) => ({
        ...mockTimeTracking,
        startTime: args.data.startTime,
      }));

      const afternoonTime = new Date('2024-01-01T14:30:00');
      const result = await service.startTracking(
        mockProjectId,
        mockEmployeeId,
        mockCycleId,
        afternoonTime,
      );

      // Should start same day at same time
      expect(result.startTime.getDate()).toBe(1);
      expect(result.startTime.getHours()).toBe(14);
    });
  });

  describe('endTracking', () => {
    it('should end active tracking and calculate duration', async () => {
      const startTime = new Date('2024-01-01T14:00:00');
      const endTime = new Date('2024-01-02T14:00:00');

      prismaService.timeTracking.findFirst.mockResolvedValue({
        ...mockTimeTracking,
        startTime,
      });

      const updatedTracking = {
        ...mockTimeTracking,
        startTime,
        endTime,
        durationDays: 1,
        approvedFileId: 'file-123',
      };
      prismaService.timeTracking.update.mockResolvedValue(updatedTracking);

      const result = await service.endTracking(
        mockCycleId,
        'file-123',
        endTime,
      );

      expect(result).toEqual(updatedTracking);
      expect(prismaService.timeTracking.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            endTime,
            approvedFileId: 'file-123',
          }),
        }),
      );
    });

    it('should return null if no active tracking', async () => {
      prismaService.timeTracking.findFirst.mockResolvedValue(null);

      const result = await service.endTracking(mockCycleId);

      expect(result).toBeNull();
      expect(prismaService.timeTracking.update).not.toHaveBeenCalled();
    });
  });

  describe('getProjectStats', () => {
    it('should return project statistics for admin', async () => {
      prismaService.project.findUnique.mockResolvedValue(mockProject);
      prismaService.timeTracking.findMany.mockResolvedValue([
        {
          durationDays: 2,
          approvedFileId: 'f1',
          cycle: { status: 'approved' },
        },
        {
          durationDays: 3,
          approvedFileId: 'f2',
          cycle: { status: 'approved' },
        },
        {
          durationDays: 1,
          approvedFileId: null,
          cycle: { status: 'rejected' },
        },
      ]);

      const result = await service.getProjectStats(
        mockProjectId,
        'admin-1',
        'ADMIN',
      );

      expect(result.totalCycles).toBe(3);
      expect(result.totalRejections).toBe(1);
      expect(result.rejectionRate).toBeCloseTo(0.33, 1);
      expect(result.averageCycleDuration).toBe(2);
    });

    it('should return stats for assigned employee', async () => {
      prismaService.project.findUnique.mockResolvedValue(mockProject);
      prismaService.timeTracking.findMany.mockResolvedValue([
        {
          durationDays: 2,
          approvedFileId: 'f1',
          cycle: { status: 'approved' },
        },
      ]);

      const result = await service.getProjectStats(
        mockProjectId,
        mockEmployeeId,
        'EMPLOYEE',
      );

      expect(result.totalCycles).toBe(1);
    });

    it('should throw error for unassigned employee', async () => {
      prismaService.project.findUnique.mockResolvedValue({
        ...mockProject,
        employees: [{ employeeId: 'other-employee' }],
      });

      await expect(
        service.getProjectStats(mockProjectId, mockEmployeeId, 'EMPLOYEE'),
      ).rejects.toThrow('You do not have access to this project');
    });

    it('should throw error if project not found', async () => {
      prismaService.project.findUnique.mockResolvedValue(null);

      await expect(service.getProjectStats(mockProjectId)).rejects.toThrow(
        `Project ${mockProjectId} not found`,
      );
    });

    it('should calculate duration for completed project', async () => {
      const completedProject = {
        ...mockProject,
        status: 'COMPLETED',
        createdAt: new Date('2024-01-01T00:00:00'),
        updatedAt: new Date('2024-01-10T00:00:00'),
      };
      prismaService.project.findUnique.mockResolvedValue(completedProject);
      prismaService.timeTracking.findMany.mockResolvedValue([]);

      const result = await service.getProjectStats(mockProjectId);

      expect(result.durationDays).toBe(9);
    });

    it('should handle zero cycles without errors', async () => {
      prismaService.project.findUnique.mockResolvedValue(mockProject);
      prismaService.timeTracking.findMany.mockResolvedValue([]);

      const result = await service.getProjectStats(mockProjectId);

      expect(result.totalCycles).toBe(0);
      expect(result.averageCycleDuration).toBe(0);
      expect(result.rejectionRate).toBe(0);
    });
  });
});
