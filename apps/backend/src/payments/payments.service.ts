import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { ProjectStatusService } from '../projects/services/project-status.service';
import {
  Payment,
  PaymentStatus,
  PaymentType,
  NotificationType,
} from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { StorageService } from '../storage/storage.service';
import { PaymentApprovalService } from './services/payment-approval.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly projectStatusService: ProjectStatusService,
    private readonly notificationsService: NotificationsService,
    private readonly storageService: StorageService,
    private readonly paymentApprovalService: PaymentApprovalService,
  ) {}

  async create(
    createPaymentDto: RecordPaymentDto,
    receiptFileUrl?: string,
  ): Promise<Payment> {
    const { projectId, amount, ...rest } = createPaymentDto;

    // Validate payment amount
    if (amount <= 0) {
      throw new BadRequestException('Payment amount must be greater than zero');
    }

    // Verify project exists
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }

    // Create payment record
    const payment = await this.prisma.payment.create({
      data: {
        projectId,
        amount,
        ...rest,
        paymentDate: new Date(createPaymentDto.paymentDate),
        receiptFileUrl,
        status: PaymentStatus.CONFIRMED, // Auto-confirm for now, or use logic based on method
      },
      include: {
        fromUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    this.logger.log(
      `Payment created: ${payment.id} for project ${projectId} amount ${amount}`,
    );

    // Update project amountPaid and check for activation
    await this.projectStatusService.updateProjectPayment(
      projectId,
      Number(amount),
    );

    // Link related files and update TimeTracking (Phase 5: Advanced Analytics)
    const relatedFileIds = createPaymentDto.relatedFileIds;
    if (relatedFileIds && relatedFileIds.length > 0) {
      // Execute in transaction to ensure consistency
      await this.prisma.$transaction(async (tx) => {
        // 1. Create PaymentFile links
        await tx.paymentFile.createMany({
          data: relatedFileIds.map((fileId) => ({
            paymentId: payment.id,
            fileId,
          })),
        });

        // 2. Link Payment to TimeTracking records associated with these files
        // Find TimeTracking records where approvedFileId is in the list
        await tx.timeTracking.updateMany({
          where: {
            approvedFileId: { in: relatedFileIds },
          },
          data: {
            paymentId: payment.id,
          },
        });
      });

      this.logger.log(
        `Linked payment ${payment.id} to ${relatedFileIds.length} files and updated tracking.`,
      );
    }

    // Notify
    if (
      (payment.type === PaymentType.INITIAL_PAYMENT ||
        payment.type === PaymentType.INVOICE) &&
      project.clientId
    ) {
      await this.notificationsService.create({
        userId: project.clientId,
        type: NotificationType.SUCCESS,
        title: 'Payment Received',
        message: `We have received your payment of $${amount}. Thank you!`,
        link: `/dashboard/projects/${projectId}/payments`,
      });
    } else if (
      payment.type === PaymentType.EMPLOYEE_PAYMENT &&
      payment.toUserId
    ) {
      await this.notificationsService.create({
        userId: payment.toUserId,
        type: NotificationType.SUCCESS,
        title: 'Payment Sent',
        message: `You have received a payment of $${amount} for project ${project.name}.`,
        link: `/dashboard/projects/${projectId}/payments`,
      });
    }

    return payment;
  }

  async findAllByProject(
    projectId: string,
    userId?: string,
    userRole?: string,
  ): Promise<Payment[]> {
    // Build where clause based on user role and permissions
    const whereClause: any = { projectId };

    // EMPLOYEE: Only see payments TO them (employee payments they received)
    if (userRole === 'EMPLOYEE') {
      whereClause.toUserId = userId;
      whereClause.type = PaymentType.EMPLOYEE_PAYMENT;
    }
    // CLIENT: Only see payments FROM them (initial payments, invoice payments they made)
    else if (userRole === 'CLIENT') {
      whereClause.OR = [
        { fromUserId: userId },
        { type: PaymentType.INITIAL_PAYMENT },
        { type: PaymentType.INVOICE },
      ];
    }
    // ADMIN: See all payments (no additional filters)

    return this.prisma.payment.findMany({
      where: whereClause,
      include: {
        fromUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        toUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        paymentDate: 'desc',
      },
    });
  }

  async findOne(id: string): Promise<Payment> {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        project: true,
        fromUser: true,
        relatedFiles: {
          include: {
            file: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException(`Payment ${id} not found`);
    }

    return payment;
  }

  /**
   * Create client payment with PENDING_APPROVAL status
   * Client uploads payment receipt
   * Notifies admin for review
   */
  async createClientPayment(
    createPaymentDto: RecordPaymentDto,
    receiptFileUrl: string,
    userId: string,
  ): Promise<Payment> {
    const { projectId, amount, ...rest } = createPaymentDto;

    // Validate payment amount
    if (amount <= 0) {
      throw new BadRequestException('Payment amount must be greater than zero');
    }

    // Verify project exists and user is the client
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        name: true,
        clientId: true,
        createdBy: true,
      },
    });

    if (!project) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }

    if (project.clientId !== userId) {
      throw new BadRequestException(
        'You can only upload payments for your own projects',
      );
    }

    // Check if there's an open invoice for this project
    const openInvoice = await this.prisma.invoice.findFirst({
      where: {
        projectId,
        status: {
          in: ['SENT', 'PARTIALLY_PAID', 'OVERDUE'],
        },
      },
      orderBy: {
        createdAt: 'desc', // Get the most recent one
      },
    });

    // Create payment with PENDING_APPROVAL status
    const payment = await this.prisma.payment.create({
      data: {
        projectId,
        amount,
        ...rest,
        fromUserId: userId, // Client is paying
        type: openInvoice ? PaymentType.INVOICE : PaymentType.INITIAL_PAYMENT,
        paymentDate: new Date(createPaymentDto.paymentDate),
        receiptFileUrl,
        status: PaymentStatus.PENDING_APPROVAL,
        invoiceId: openInvoice?.id, // Link to invoice if exists
      },
      include: {
        fromUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            createdBy: true,
          },
        },
      },
    });

    const invoiceSuffix = openInvoice ? ` (linked to invoice ${openInvoice.id})` : '';
    this.logger.log(
      `Client payment uploaded: ${payment.id} for project ${projectId} amount ${amount} - PENDING_APPROVAL${invoiceSuffix}`,
    );

    // Notify admin (project creator) for review
    if (payment.fromUser) {
      await this.notificationsService.create({
        userId: project.createdBy,
        type: NotificationType.INFO,
        title: 'Nuevo Comprobante de Pago',
        message: `${payment.fromUser.firstName} ${payment.fromUser.lastName} ha subido un comprobante de pago de $${amount} para ${project.name}. Por favor revíselo.`,
        link: `/dashboard/projects/${projectId}?tab=payments`,
      });
    }

    return payment;
  }

  /**
   * Admin approves payment - delegates to PaymentApprovalService
   */
  async approvePayment(
    paymentId: string,
    adminId: string,
    correctedAmount?: number,
  ): Promise<Payment> {
    return this.paymentApprovalService.approvePayment(
      paymentId,
      adminId,
      correctedAmount,
    );
  }

  /**
   * Admin rejects payment - delegates to PaymentApprovalService
   */
  async rejectPayment(
    paymentId: string,
    adminId: string,
    rejectionReason: string,
  ): Promise<Payment> {
    return this.paymentApprovalService.rejectPayment(
      paymentId,
      adminId,
      rejectionReason,
    );
  }

  /**
   * Get presigned URL for payment receipt
   * Returns a temporary URL to view/download the receipt from MinIO
   */
  async getReceiptDownloadUrl(paymentId: string): Promise<string> {
    const payment = await this.findOne(paymentId);

    if (!payment.receiptFileUrl) {
      throw new BadRequestException('This payment has no receipt file');
    }

    const storagePath = payment.receiptFileUrl;

    // Handle legacy local file paths (migrate to MinIO format)
    // Old format: /uploads/receipts/filename.pdf
    // New format: projects/{projectId}/{filename}
    if (storagePath.startsWith('/uploads/receipts/')) {
      this.logger.warn(
        `Payment ${paymentId} has legacy receipt path: ${storagePath}. ` +
          `This file may not exist in MinIO. Please re-upload the receipt.`,
      );
      throw new BadRequestException(
        'This payment receipt was uploaded using an old system and is no longer accessible. ' +
          'Please upload a new receipt file.',
      );
    }

    // Generate presigned URL from MinIO
    return this.storageService.getDownloadUrl(storagePath);
  }
}
