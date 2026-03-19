import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { PaymentApprovalService } from './payment-approval.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ProjectStatusService } from '../../projects/services/project-status.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { PaymentStatus, NotificationType } from '@prisma/client';
import { Prisma } from '@prisma/client';

describe('PaymentApprovalService', () => {
  let service: PaymentApprovalService;
  let prismaService: any;
  let projectStatusService: any;
  let notificationsService: any;

  const mockPaymentId = 'payment-123';
  const mockAdminId = 'admin-123';
  const mockProjectId = 'project-123';
  const mockClientId = 'client-123';

  const mockPayment = {
    id: mockPaymentId,
    projectId: mockProjectId,
    amount: new Prisma.Decimal(1000),
    status: PaymentStatus.PENDING_APPROVAL,
    invoiceId: 'invoice-123',
    project: {
      id: mockProjectId,
      name: 'Test Project',
      clientId: mockClientId,
      amountPaid: new Prisma.Decimal(0),
    },
    fromUser: {
      id: mockClientId,
      firstName: 'John',
      lastName: 'Doe',
    },
    invoice: {
      id: 'invoice-123',
      totalAmount: new Prisma.Decimal(2000),
      amountPaid: new Prisma.Decimal(0),
      status: 'PENDING',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentApprovalService,
        {
          provide: PrismaService,
          useValue: {
            payment: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            project: {
              update: jest.fn(),
            },
            invoice: {
              update: jest.fn(),
            },
            $transaction: jest.fn().mockImplementation(async (callback) => {
              return callback(prismaService);
            }),
          },
        },
        {
          provide: ProjectStatusService,
          useValue: {
            canActivateProject: jest.fn(),
            activateProject: jest.fn(),
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

    service = module.get<PaymentApprovalService>(PaymentApprovalService);
    prismaService = module.get<PrismaService>(PrismaService);
    projectStatusService =
      module.get<ProjectStatusService>(ProjectStatusService);
    notificationsService =
      module.get<NotificationsService>(NotificationsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('approvePayment', () => {
    it('should approve pending payment', async () => {
      prismaService.payment.findUnique.mockResolvedValue(mockPayment);
      const approvedPayment = {
        ...mockPayment,
        status: PaymentStatus.CONFIRMED,
        reviewedBy: mockAdminId,
      };

      // Mock transaction to return the approved payment
      prismaService.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          payment: {
            update: jest.fn().mockResolvedValue(approvedPayment),
          },
          project: {
            update: jest.fn().mockResolvedValue(mockPayment.project),
          },
          invoice: {
            update: jest.fn().mockResolvedValue(mockPayment.invoice),
          },
        };
        return callback(mockTx);
      });

      projectStatusService.canActivateProject.mockResolvedValue({
        canActivate: false,
      });

      const result = await service.approvePayment(mockPaymentId, mockAdminId);

      expect(result.status).toBe(PaymentStatus.CONFIRMED);
      expect(prismaService.$transaction).toHaveBeenCalled();
      expect(notificationsService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockClientId,
          type: NotificationType.SUCCESS,
          title: 'Pago Aprobado',
        }),
      );
    });

    it('should approve payment with corrected amount', async () => {
      prismaService.payment.findUnique.mockResolvedValue(mockPayment);
      const correctedAmount = 800;
      const approvedPayment = {
        ...mockPayment,
        amount: correctedAmount,
        status: PaymentStatus.CONFIRMED,
      };

      prismaService.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          payment: {
            update: jest.fn().mockResolvedValue(approvedPayment),
          },
          project: {
            update: jest.fn().mockResolvedValue(mockPayment.project),
          },
          invoice: {
            update: jest.fn().mockResolvedValue(mockPayment.invoice),
          },
        };
        return callback(mockTx);
      });

      projectStatusService.canActivateProject.mockResolvedValue({
        canActivate: false,
      });

      const result = await service.approvePayment(
        mockPaymentId,
        mockAdminId,
        correctedAmount,
      );

      expect(result.amount).toBe(correctedAmount);
      // Should notify about amount correction
      expect(notificationsService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('ajustado'),
        }),
      );
    });

    it('should throw NotFoundException if payment not found', async () => {
      prismaService.payment.findUnique.mockResolvedValue(null);

      await expect(
        service.approvePayment(mockPaymentId, mockAdminId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if payment is not pending approval', async () => {
      prismaService.payment.findUnique.mockResolvedValue({
        ...mockPayment,
        status: PaymentStatus.CONFIRMED,
      });

      await expect(
        service.approvePayment(mockPaymentId, mockAdminId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if corrected amount is zero or negative', async () => {
      prismaService.payment.findUnique.mockResolvedValue(mockPayment);

      await expect(
        service.approvePayment(mockPaymentId, mockAdminId, 0),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.approvePayment(mockPaymentId, mockAdminId, -100),
      ).rejects.toThrow(BadRequestException);
    });

    it('should auto-activate project if requirements met after approval', async () => {
      prismaService.payment.findUnique.mockResolvedValue(mockPayment);
      const approvedPayment = {
        ...mockPayment,
        status: PaymentStatus.CONFIRMED,
      };

      prismaService.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          payment: {
            update: jest.fn().mockResolvedValue(approvedPayment),
          },
          project: {
            update: jest.fn().mockResolvedValue(mockPayment.project),
          },
          invoice: {
            update: jest.fn().mockResolvedValue(mockPayment.invoice),
          },
        };
        return callback(mockTx);
      });

      projectStatusService.canActivateProject.mockResolvedValue({
        canActivate: true,
      });
      projectStatusService.activateProject.mockResolvedValue({});

      await service.approvePayment(mockPaymentId, mockAdminId);

      expect(projectStatusService.canActivateProject).toHaveBeenCalledWith(
        mockProjectId,
      );
      expect(projectStatusService.activateProject).toHaveBeenCalledWith(
        mockProjectId,
      );
    });

    it('should handle auto-activation failure gracefully', async () => {
      prismaService.payment.findUnique.mockResolvedValue(mockPayment);
      const approvedPayment = {
        ...mockPayment,
        status: PaymentStatus.CONFIRMED,
      };

      prismaService.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          payment: {
            update: jest.fn().mockResolvedValue(approvedPayment),
          },
          project: {
            update: jest.fn().mockResolvedValue(mockPayment.project),
          },
          invoice: {
            update: jest.fn().mockResolvedValue(mockPayment.invoice),
          },
        };
        return callback(mockTx);
      });

      projectStatusService.canActivateProject.mockRejectedValue(
        new Error('Activation check failed'),
      );

      // Should not throw - payment approval should still succeed
      const result = await service.approvePayment(mockPaymentId, mockAdminId);
      expect(result.status).toBe(PaymentStatus.CONFIRMED);
    });
  });

  describe('rejectPayment', () => {
    it('should reject pending payment with reason', async () => {
      prismaService.payment.findUnique.mockResolvedValue(mockPayment);
      const rejectedPayment = {
        ...mockPayment,
        status: PaymentStatus.REJECTED,
        rejectionReason: 'Invalid receipt',
        reviewedBy: mockAdminId,
      };
      prismaService.payment.update.mockResolvedValue(rejectedPayment);

      const result = await service.rejectPayment(
        mockPaymentId,
        mockAdminId,
        'Invalid receipt',
      );

      expect(result.status).toBe(PaymentStatus.REJECTED);
      expect(prismaService.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: PaymentStatus.REJECTED,
            rejectionReason: 'Invalid receipt',
            reviewedBy: mockAdminId,
          }),
        }),
      );
      expect(notificationsService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockClientId,
          type: NotificationType.WARNING,
          title: 'Comprobante Rechazado',
          message: expect.stringContaining('Invalid receipt'),
        }),
      );
    });

    it('should throw NotFoundException if payment not found', async () => {
      prismaService.payment.findUnique.mockResolvedValue(null);

      await expect(
        service.rejectPayment(mockPaymentId, mockAdminId, 'Reason'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if payment is not pending approval', async () => {
      prismaService.payment.findUnique.mockResolvedValue({
        ...mockPayment,
        status: PaymentStatus.CONFIRMED,
      });

      await expect(
        service.rejectPayment(mockPaymentId, mockAdminId, 'Reason'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
