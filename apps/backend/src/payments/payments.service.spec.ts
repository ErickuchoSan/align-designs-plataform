import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectStatusService } from '../projects/services/project-status.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PaymentApprovalService } from './services/payment-approval.service';
import { PaymentStatus, PaymentType, NotificationType } from '@prisma/client';
import { BadRequestException, NotFoundException } from '@nestjs/common';

// Mock StorageService to avoid uuid import issues
jest.mock('../storage/storage.service', () => ({
  StorageService: jest.fn().mockImplementation(() => ({
    getDownloadUrl: jest.fn(),
  })),
}));

import { StorageService } from '../storage/storage.service';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let prismaService: any;
  let projectStatusService: any;
  let notificationsService: any;
  let storageService: any;
  let paymentApprovalService: any;

  const mockProjectId = 'project-123';
  const mockUserId = 'user-123';
  const mockPaymentId = 'payment-123';

  const mockProject = {
    id: mockProjectId,
    name: 'Test Project',
    clientId: 'client-123',
    createdBy: 'admin-123',
  };

  const mockPayment = {
    id: mockPaymentId,
    projectId: mockProjectId,
    amount: 1000,
    status: PaymentStatus.CONFIRMED,
    paymentDate: new Date(),
    type: PaymentType.INITIAL_PAYMENT,
    fromUser: {
      id: mockUserId,
      firstName: 'Test',
      lastName: 'Client',
      email: 'test@example.com',
    },
    project: mockProject,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: PrismaService,
          useValue: {
            project: {
              findUnique: jest.fn(),
            },
            payment: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            invoice: {
              findUnique: jest.fn(),
              findFirst: jest.fn(),
              update: jest.fn(),
            },
            paymentFile: {
              createMany: jest.fn(),
            },
            timeTracking: {
              updateMany: jest.fn(),
            },
            $transaction: jest.fn().mockImplementation(async (callback) => {
              if (typeof callback === 'function') {
                return callback(prismaService);
              }
              return callback; // In case it's a promise array (not used here but good practice)
            }),
          },
        },
        {
          provide: ProjectStatusService,
          useValue: {
            updateProjectPayment: jest.fn(),
          },
        },
        {
          provide: NotificationsService,
          useValue: {
            create: jest.fn(),
          },
        },
        {
          provide: StorageService,
          useValue: {
            getDownloadUrl: jest.fn(),
          },
        },
        {
          provide: PaymentApprovalService,
          useValue: {
            requestApproval: jest.fn(),
            approvePayment: jest.fn(),
            rejectPayment: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    prismaService = module.get<PrismaService>(PrismaService);
    projectStatusService =
      module.get<ProjectStatusService>(ProjectStatusService);
    notificationsService =
      module.get<NotificationsService>(NotificationsService);
    storageService = module.get<StorageService>(StorageService);
    paymentApprovalService = module.get<PaymentApprovalService>(PaymentApprovalService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto: any = {
      projectId: mockProjectId,
      amount: 1000,
      paymentDate: new Date().toISOString(),
      type: PaymentType.INITIAL_PAYMENT,
    };

    it('should create a payment and verify project', async () => {
      prismaService.project.findUnique.mockResolvedValue(mockProject);
      prismaService.payment.create.mockResolvedValue(mockPayment);
      projectStatusService.updateProjectPayment.mockResolvedValue({});

      const result = await service.create(createDto);

      expect(result).toEqual(mockPayment);
      expect(prismaService.payment.create).toHaveBeenCalled();
      expect(projectStatusService.updateProjectPayment).toHaveBeenCalledWith(
        mockProjectId,
        1000,
      );
      expect(notificationsService.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if project not found', async () => {
      prismaService.project.findUnique.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createClientPayment', () => {
    const createDto: any = {
      projectId: mockProjectId,
      amount: 500,
      paymentDate: new Date().toISOString(),
    };

    it('should create pending payment for client', async () => {
      // Correctly mocking the project with clientId matching the user
      prismaService.project.findUnique.mockResolvedValue({
        ...mockProject,
        clientId: mockUserId,
      });
      prismaService.invoice.findFirst.mockResolvedValue(null); // No open invoice

      const pendingPayment = {
        ...mockPayment,
        status: PaymentStatus.PENDING_APPROVAL,
        fromUser: {
          id: mockUserId,
          firstName: 'Client',
          lastName: 'Name',
          email: 'c@test.com',
        }, // Ensure fromUser exists for notification
      };
      prismaService.payment.create.mockResolvedValue(pendingPayment);

      const result = await service.createClientPayment(
        createDto,
        'receipt-url',
        mockUserId,
      );

      expect(result.status).toBe(PaymentStatus.PENDING_APPROVAL);
      expect(prismaService.payment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: PaymentStatus.PENDING_APPROVAL,
            receiptFileUrl: 'receipt-url',
          }),
        }),
      );
      expect(notificationsService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockProject.createdBy, // Should notify admin
          title: expect.stringContaining('Nuevo Comprobante'),
        }),
      );
    });

    it('should throw BadRequest if user is not the client', async () => {
      prismaService.project.findUnique.mockResolvedValue({
        ...mockProject,
        clientId: 'other-client',
      });

      await expect(
        service.createClientPayment(createDto, 'url', mockUserId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('approvePayment', () => {
    it('should delegate to paymentApprovalService', async () => {
      const approvedPayment = {
        ...mockPayment,
        status: PaymentStatus.CONFIRMED,
      };
      paymentApprovalService.approvePayment.mockResolvedValue(approvedPayment);

      const result = await service.approvePayment(mockPaymentId, 'admin-id');

      expect(paymentApprovalService.approvePayment).toHaveBeenCalledWith(
        mockPaymentId,
        'admin-id',
        undefined,
      );
      expect(result.status).toBe(PaymentStatus.CONFIRMED);
    });

    it('should throw BadRequest when paymentApprovalService throws', async () => {
      paymentApprovalService.approvePayment.mockRejectedValue(
        new BadRequestException('Payment is not pending approval'),
      );

      await expect(
        service.approvePayment(mockPaymentId, 'admin-id'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('rejectPayment', () => {
    it('should delegate to paymentApprovalService', async () => {
      const rejectedPayment = {
        ...mockPayment,
        status: PaymentStatus.REJECTED,
      };
      paymentApprovalService.rejectPayment.mockResolvedValue(rejectedPayment);

      const result = await service.rejectPayment(
        mockPaymentId,
        'admin-id',
        'Invalid receipt',
      );

      expect(paymentApprovalService.rejectPayment).toHaveBeenCalledWith(
        mockPaymentId,
        'admin-id',
        'Invalid receipt',
      );
      expect(result.status).toBe(PaymentStatus.REJECTED);
    });
  });

  describe('getReceiptDownloadUrl', () => {
    it('should return presigned url', async () => {
      const paymentWithReceipt = {
        ...mockPayment,
        receiptFileUrl: 'path/to/receipt.pdf',
      };
      prismaService.payment.findUnique.mockResolvedValue(paymentWithReceipt);
      storageService.getDownloadUrl.mockResolvedValue('http://signed.url');

      const result = await service.getReceiptDownloadUrl(mockPaymentId);

      expect(result).toBe('http://signed.url');
      expect(storageService.getDownloadUrl).toHaveBeenCalledWith(
        'path/to/receipt.pdf',
      );
    });
  });
});
