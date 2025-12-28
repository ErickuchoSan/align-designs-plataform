import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { ProjectStatusService } from '../projects/services/project-status.service';
import { Payment, PaymentStatus, PaymentType, NotificationType } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PaymentsService {
    private readonly logger = new Logger(PaymentsService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly projectStatusService: ProjectStatusService,
        private readonly notificationsService: NotificationsService,
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
        if (createPaymentDto.relatedFileIds && createPaymentDto.relatedFileIds.length > 0) {
            // 1. Create PaymentFile links
            await this.prisma.paymentFile.createMany({
                data: createPaymentDto.relatedFileIds.map(fileId => ({
                    paymentId: payment.id,
                    fileId
                }))
            });

            // 2. Link Payment to TimeTracking records associated with these files
            // Find TimeTracking records where approvedFileId is in the list
            await this.prisma.timeTracking.updateMany({
                where: {
                    approvedFileId: { in: createPaymentDto.relatedFileIds }
                },
                data: {
                    paymentId: payment.id
                }
            });

            this.logger.log(`Linked payment ${payment.id} to ${createPaymentDto.relatedFileIds.length} files and updated tracking.`);
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

    async findAllByProject(projectId: string): Promise<Payment[]> {
        return this.prisma.payment.findMany({
            where: { projectId },
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
}
