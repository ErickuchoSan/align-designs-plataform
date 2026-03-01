import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ProjectStatusService } from '../../projects/services/project-status.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { Payment, PaymentStatus, NotificationType } from '@prisma/client';

/**
 * PaymentApprovalService
 *
 * Single Responsibility: Handles the approval and rejection workflow for payments.
 * This service is responsible for:
 * - Approving pending payments (with optional amount correction)
 * - Rejecting payments with reason
 * - Updating related invoices when payments are approved
 * - Sending notifications to clients
 */
@Injectable()
export class PaymentApprovalService {
    private readonly logger = new Logger(PaymentApprovalService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly projectStatusService: ProjectStatusService,
        private readonly notificationsService: NotificationsService,
    ) { }

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
            await this.updateInvoiceAfterApproval(payment.invoiceId, finalAmount);
        }

        // Notify client
        if (payment.fromUser) {
            await this.notifyPaymentApproved(
                payment.fromUser.id,
                payment.project.id,
                finalAmount,
                wasAmountCorrected,
                Number(payment.amount),
            );
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
     * Update invoice amounts after payment approval
     */
    private async updateInvoiceAfterApproval(invoiceId: string, amount: number): Promise<void> {
        const invoice = await this.prisma.invoice.findUnique({
            where: { id: invoiceId },
        });

        if (!invoice) {
            return;
        }

        const newAmountPaid = Number(invoice.amountPaid) + amount;
        const totalAmount = Number(invoice.totalAmount);

        // Determine new status
        let newStatus = invoice.status;
        if (newAmountPaid >= totalAmount) {
            newStatus = 'PAID';
        } else if (newAmountPaid > 0) {
            newStatus = 'PARTIALLY_PAID';
        }

        await this.prisma.invoice.update({
            where: { id: invoiceId },
            data: {
                amountPaid: newAmountPaid,
                status: newStatus,
            },
        });

        this.logger.log(
            `Updated invoice ${invoiceId} amountPaid to ${newAmountPaid}, status: ${newStatus}`,
        );
    }

    /**
     * Send notification for approved payment
     */
    private async notifyPaymentApproved(
        userId: string,
        projectId: string,
        finalAmount: number,
        wasAmountCorrected: boolean,
        originalAmount: number,
    ): Promise<void> {
        const notificationMessage = wasAmountCorrected
            ? `Su comprobante de pago ha sido aprobado. El monto fue ajustado a $${finalAmount.toFixed(2)} (monto original: $${originalAmount.toFixed(2)}). El pago ha sido registrado.`
            : `Su comprobante de pago de $${finalAmount.toFixed(2)} ha sido aprobado y registrado exitosamente.`;

        await this.notificationsService.create({
            userId,
            type: NotificationType.SUCCESS,
            title: 'Pago Aprobado',
            message: notificationMessage,
            link: `/dashboard/projects/${projectId}?tab=payments`,
        });
    }
}
