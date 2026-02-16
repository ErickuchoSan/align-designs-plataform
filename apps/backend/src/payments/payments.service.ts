import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { ProjectStatusService } from '../projects/services/project-status.service';
import { Payment, PaymentStatus, PaymentType, NotificationType } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class PaymentsService {
    private readonly logger = new Logger(PaymentsService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly projectStatusService: ProjectStatusService,
        private readonly notificationsService: NotificationsService,
        private readonly storageService: StorageService,
    ) { }

    async create(createPaymentDto: RecordPaymentDto, receiptFileUrl?: string): Promise<Payment> {
        const { projectId, amount, ...rest } = createPaymentDto;

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

        this.logger.log(`Payment created: ${payment.id} for project ${projectId} amount ${amount}`);

        // Update project amountPaid and check for activation
        await this.projectStatusService.updateProjectPayment(projectId, Number(amount));

        // Link related files and update TimeTracking (Phase 5: Advanced Analytics)
        const relatedFileIds = createPaymentDto.relatedFileIds;
        if (relatedFileIds && relatedFileIds.length > 0) {
            // Execute in transaction to ensure consistency
            await this.prisma.$transaction(async (tx) => {
                // 1. Create PaymentFile links
                await tx.paymentFile.createMany({
                    data: relatedFileIds.map(fileId => ({
                        paymentId: payment.id,
                        fileId
                    }))
                });

                // 2. Link Payment to TimeTracking records associated with these files
                // Find TimeTracking records where approvedFileId is in the list
                await tx.timeTracking.updateMany({
                    where: {
                        approvedFileId: { in: relatedFileIds }
                    },
                    data: {
                        paymentId: payment.id
                    }
                });
            });

            this.logger.log(`Linked payment ${payment.id} to ${relatedFileIds.length} files and updated tracking.`);
        }

        // Notify
        if ((payment.type === PaymentType.INITIAL_PAYMENT || payment.type === PaymentType.INVOICE) && project.clientId) {
            await this.notificationsService.create({
                userId: project.clientId,
                type: NotificationType.SUCCESS,
                title: 'Payment Received',
                message: `We have received your payment of $${amount}. Thank you!`,
                link: `/dashboard/projects/${projectId}/payments`,
            });
        } else if (payment.type === PaymentType.EMPLOYEE_PAYMENT && payment.toUserId) {
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

    async findAllByProject(projectId: string, userId?: string, userRole?: string): Promise<Payment[]> {
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
                        file: true
                    }
                }
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
            throw new BadRequestException('You can only upload payments for your own projects');
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

        this.logger.log(
            `Client payment uploaded: ${payment.id} for project ${projectId} amount ${amount} - PENDING_APPROVAL${openInvoice ? ` (linked to invoice ${openInvoice.id})` : ''}`,
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
     * Admin approves payment
     * Can optionally correct the amount
     * Updates project amountPaid
     * Notifies client
     */
    async approvePayment(
        paymentId: string,
        adminId: string,
        correctedAmount?: number,
    ): Promise<Payment> {
        const payment = await this.prisma.payment.findUnique({
            where: { id: paymentId },
            include: {
                project: {
                    select: {
                        id: true,
                        name: true,
                        clientId: true,
                    },
                },
                fromUser: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });

        if (!payment) {
            throw new NotFoundException(`Payment ${paymentId} not found`);
        }

        if (payment.status !== PaymentStatus.PENDING_APPROVAL) {
            throw new BadRequestException(
                `Payment is not pending approval. Current status: ${payment.status}`,
            );
        }

        const finalAmount = correctedAmount !== undefined ? correctedAmount : Number(payment.amount);
        const wasAmountCorrected = correctedAmount !== undefined && correctedAmount !== Number(payment.amount);

        // Update payment status
        const updatedPayment = await this.prisma.payment.update({
            where: { id: paymentId },
            data: {
                status: PaymentStatus.CONFIRMED,
                amount: finalAmount,
                reviewedBy: adminId,
                reviewedAt: new Date(),
            },
            include: {
                fromUser: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
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
            `Payment ${paymentId} approved by admin ${adminId}. Amount: ${finalAmount}${wasAmountCorrected ? ' (corrected from ' + payment.amount + ')' : ''}`,
        );

        // Update project amountPaid
        await this.projectStatusService.updateProjectPayment(payment.project.id, finalAmount);

        // If payment is associated with an invoice, update the invoice
        if (payment.invoiceId) {
            const invoice = await this.prisma.invoice.findUnique({
                where: { id: payment.invoiceId },
            });

            if (invoice) {
                const newAmountPaid = Number(invoice.amountPaid) + finalAmount;
                const totalAmount = Number(invoice.totalAmount);

                // Determine new status
                let newStatus = invoice.status;
                if (newAmountPaid >= totalAmount) {
                    newStatus = 'PAID';
                } else if (newAmountPaid > 0) {
                    newStatus = 'PARTIALLY_PAID';
                }

                await this.prisma.invoice.update({
                    where: { id: payment.invoiceId },
                    data: {
                        amountPaid: newAmountPaid,
                        status: newStatus,
                    },
                });

                this.logger.log(
                    `Updated invoice ${payment.invoiceId} amountPaid to ${newAmountPaid}, status: ${newStatus}`,
                );
            }
        }

        // Notify client
        if (payment.fromUser) {
            const notificationMessage = wasAmountCorrected
                ? `Su comprobante de pago ha sido aprobado. El monto fue ajustado a $${finalAmount.toFixed(2)} (monto original: $${Number(payment.amount).toFixed(2)}). El pago ha sido registrado.`
                : `Su comprobante de pago de $${finalAmount.toFixed(2)} ha sido aprobado y registrado exitosamente.`;

            await this.notificationsService.create({
                userId: payment.fromUser.id,
                type: NotificationType.SUCCESS,
                title: 'Pago Aprobado',
                message: notificationMessage,
                link: `/dashboard/projects/${payment.project.id}?tab=payments`,
            });
        }

        return updatedPayment;
    }

    /**
     * Admin rejects payment
     * Requires rejection reason
     * Notifies client to re-upload
     */
    async rejectPayment(
        paymentId: string,
        adminId: string,
        rejectionReason: string,
    ): Promise<Payment> {
        const payment = await this.prisma.payment.findUnique({
            where: { id: paymentId },
            include: {
                project: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                fromUser: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });

        if (!payment) {
            throw new NotFoundException(`Payment ${paymentId} not found`);
        }

        if (payment.status !== PaymentStatus.PENDING_APPROVAL) {
            throw new BadRequestException(
                `Payment is not pending approval. Current status: ${payment.status}`,
            );
        }

        // Update payment status
        const updatedPayment = await this.prisma.payment.update({
            where: { id: paymentId },
            data: {
                status: PaymentStatus.REJECTED,
                reviewedBy: adminId,
                reviewedAt: new Date(),
                rejectionReason,
            },
            include: {
                fromUser: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
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
            `Payment ${paymentId} rejected by admin ${adminId}. Reason: ${rejectionReason}`,
        );

        // Notify client
        if (payment.fromUser) {
            await this.notificationsService.create({
                userId: payment.fromUser.id,
                type: NotificationType.WARNING,
                title: 'Comprobante Rechazado',
                message: `Su comprobante de pago para ${payment.project.name} ha sido rechazado. Motivo: ${rejectionReason}. Por favor, suba un nuevo comprobante.`,
                link: `/dashboard/projects/${payment.project.id}?tab=payments`,
            });
        }

        return updatedPayment;
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

        let storagePath = payment.receiptFileUrl;

        // Handle legacy local file paths (migrate to MinIO format)
        // Old format: /uploads/receipts/filename.pdf
        // New format: projects/{projectId}/{filename}
        if (storagePath.startsWith('/uploads/receipts/')) {
            this.logger.warn(
                `Payment ${paymentId} has legacy receipt path: ${storagePath}. ` +
                `This file may not exist in MinIO. Please re-upload the receipt.`
            );
            throw new BadRequestException(
                'This payment receipt was uploaded using an old system and is no longer accessible. ' +
                'Please upload a new receipt file.'
            );
        }

        // Generate presigned URL from MinIO
        return this.storageService.getDownloadUrl(storagePath);
    }
}
