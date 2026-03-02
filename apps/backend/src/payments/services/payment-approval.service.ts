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
     *
     * Uses atomic transaction to ensure data consistency
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
                        amountPaid: true,
                    },
                },
                fromUser: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                invoice: {
                    select: {
                        id: true,
                        totalAmount: true,
                        amountPaid: true,
                        status: true,
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

        // Validate amount
        if (finalAmount <= 0) {
            throw new BadRequestException('Payment amount must be greater than zero');
        }

        // Check for overpayment on invoice
        let overpaymentWarning: string | null = null;
        if (payment.invoice) {
            const invoiceTotal = Number(payment.invoice.totalAmount);
            const invoicePaid = Number(payment.invoice.amountPaid);
            const newTotal = invoicePaid + finalAmount;

            if (newTotal > invoiceTotal) {
                const overpayment = newTotal - invoiceTotal;
                overpaymentWarning = `Overpayment of $${overpayment.toFixed(2)} detected. Invoice total: $${invoiceTotal.toFixed(2)}, Already paid: $${invoicePaid.toFixed(2)}, This payment: $${finalAmount.toFixed(2)}`;
                this.logger.warn(`Payment ${paymentId}: ${overpaymentWarning}`);
            }
        }

        // Use transaction to ensure atomicity
        const result = await this.prisma.$transaction(async (tx) => {
            // 1. Update payment status
            const updatedPayment = await tx.payment.update({
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

            // 2. Update project amountPaid
            const newProjectTotal = Number(payment.project.amountPaid) + finalAmount;
            await tx.project.update({
                where: { id: payment.project.id },
                data: {
                    amountPaid: newProjectTotal,
                },
            });

            // 3. Update invoice if linked
            if (payment.invoiceId && payment.invoice) {
                const newInvoiceAmountPaid = Number(payment.invoice.amountPaid) + finalAmount;
                const invoiceTotal = Number(payment.invoice.totalAmount);

                let newInvoiceStatus = payment.invoice.status;
                if (newInvoiceAmountPaid >= invoiceTotal) {
                    newInvoiceStatus = 'PAID';
                } else if (newInvoiceAmountPaid > 0) {
                    newInvoiceStatus = 'PARTIALLY_PAID';
                }

                await tx.invoice.update({
                    where: { id: payment.invoiceId },
                    data: {
                        amountPaid: newInvoiceAmountPaid,
                        status: newInvoiceStatus,
                    },
                });
            }

            return updatedPayment;
        });

        this.logger.log(
            `Payment ${paymentId} approved by admin ${adminId}. Amount: ${finalAmount}${wasAmountCorrected ? ' (corrected from ' + payment.amount + ')' : ''}`,
        );

        // Check if project should be auto-activated (non-blocking)
        try {
            const validation = await this.projectStatusService.canActivateProject(payment.project.id);
            if (validation.canActivate) {
                await this.projectStatusService.activateProject(payment.project.id);
                this.logger.log(`Project ${payment.project.id} auto-activated after payment approval`);
            }
        } catch (error) {
            // Log but don't fail - the payment is already approved
            this.logger.warn(`Auto-activation check failed for project ${payment.project.id}: ${error}`);
        }

        // Notify client (non-blocking)
        if (payment.fromUser) {
            await this.notifyPaymentApproved(
                payment.fromUser.id,
                payment.project.id,
                finalAmount,
                wasAmountCorrected,
                Number(payment.amount),
                overpaymentWarning,
            );
        }

        return result;
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
     * Send notification for approved payment
     */
    private async notifyPaymentApproved(
        userId: string,
        projectId: string,
        finalAmount: number,
        wasAmountCorrected: boolean,
        originalAmount: number,
        overpaymentWarning?: string | null,
    ): Promise<void> {
        let notificationMessage = wasAmountCorrected
            ? `Su comprobante de pago ha sido aprobado. El monto fue ajustado a $${finalAmount.toFixed(2)} (monto original: $${originalAmount.toFixed(2)}). El pago ha sido registrado.`
            : `Su comprobante de pago de $${finalAmount.toFixed(2)} ha sido aprobado y registrado exitosamente.`;

        // Add overpayment notice if applicable
        if (overpaymentWarning) {
            notificationMessage += ' Nota: El pago excede el monto de la factura. El saldo a favor será aplicado a futuros servicios.';
        }

        await this.notificationsService.create({
            userId,
            type: NotificationType.SUCCESS,
            title: 'Pago Aprobado',
            message: notificationMessage,
            link: `/dashboard/projects/${projectId}?tab=payments`,
        });
    }
}
