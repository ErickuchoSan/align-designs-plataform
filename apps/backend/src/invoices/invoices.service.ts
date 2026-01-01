import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { InvoiceStatus, Invoice, NotificationType } from '@prisma/client';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class InvoicesService {
    private readonly logger = new Logger(InvoicesService.name);

    constructor(
        private prisma: PrismaService,
        private readonly notificationsService: NotificationsService,
    ) { }

    async create(data: CreateInvoiceDto): Promise<Invoice> {
        const invoiceNumber = await this.generateInvoiceNumber();

        return this.prisma.invoice.create({
            data: {
                ...data,
                invoiceNumber,
                status: InvoiceStatus.DRAFT,
            },
        });
    }

    async findAll(filters: { projectId?: string; clientId?: string }) {
        return this.prisma.invoice.findMany({
            where: filters,
            include: {
                project: { select: { name: true } },
                client: { select: { firstName: true, lastName: true, email: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: string): Promise<Invoice> {
        const invoice = await this.prisma.invoice.findUnique({
            where: { id },
            include: {
                project: true,
                client: true,
                payments: true,
            },
        });

        if (!invoice) throw new NotFoundException('Invoice not found');
        return invoice;
    }

    async updateStatus(id: string, status: InvoiceStatus): Promise<Invoice> {
        const data: any = { status };
        if (status === InvoiceStatus.SENT) {
            data.sentToClientAt = new Date();
        }
        return this.prisma.invoice.update({
            where: { id },
            data,
        });
    }

    /**
     * Auto-generate invoice when project is created with initialAmountRequired
     * Called from ProjectsService.create()
     */
    async createInvoiceForProject(
        projectId: string,
        clientId: string,
        amount: number,
        paymentTermsDays: number = 15,
    ): Promise<Invoice> {
        const invoiceNumber = await this.generateInvoiceNumber();
        const issueDate = new Date();
        const dueDate = new Date(issueDate);
        dueDate.setDate(dueDate.getDate() + paymentTermsDays);

        const invoice = await this.prisma.invoice.create({
            data: {
                invoiceNumber,
                projectId,
                clientId,
                issueDate,
                dueDate,
                paymentTermsDays,
                subtotal: amount,
                taxAmount: 0, // Sin impuestos por ahora
                totalAmount: amount,
                amountPaid: 0,
                status: InvoiceStatus.DRAFT, // Inicia como borrador
            },
            include: {
                project: {
                    select: {
                        name: true,
                    },
                },
                client: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
        });

        this.logger.log(
            `Auto-generated invoice ${invoiceNumber} for project ${projectId}, amount: $${amount}`,
        );

        return invoice;
    }

    async generateInvoiceNumber(): Promise<string> {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        // Find last invoice of the day
        const prefix = `INV-${year}-${month}-${day}`;
        const lastInvoice = await this.prisma.invoice.findFirst({
            where: { invoiceNumber: { startsWith: prefix } },
            orderBy: { invoiceNumber: 'desc' },
        });

        let sequence = 1;
        if (lastInvoice) {
            const parts = lastInvoice.invoiceNumber.split('-');
            const lastSeq = parseInt(parts[parts.length - 1]);
            if (!isNaN(lastSeq)) sequence = lastSeq + 1;
        }

        return `${prefix}-${String(sequence).padStart(3, '0')}`;
    }

    async getMetrics() {
        const totalSent = await this.prisma.invoice.count({ where: { status: InvoiceStatus.SENT } });
        const totalPaid = await this.prisma.invoice.count({ where: { status: InvoiceStatus.PAID } });
        const totalOverdue = await this.prisma.invoice.count({ where: { status: InvoiceStatus.OVERDUE } });

        const revenue = await this.prisma.invoice.aggregate({
            where: { status: InvoiceStatus.PAID },
            _sum: { totalAmount: true }
        });

        return {
            totalSent,
            totalPaid,
            totalOverdue,
            totalRevenue: revenue._sum.totalAmount || 0
        };
    }

    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async checkOverdueInvoices() {
        this.logger.log('Checking for overdue invoices...');
        const overdueInvoices = await this.prisma.invoice.findMany({
            where: {
                status: InvoiceStatus.SENT,
                dueDate: {
                    lt: new Date(),
                },
            },
            include: {
                project: { select: { clientId: true, name: true } },
            },
        });

        this.logger.log(`Found ${overdueInvoices.length} invoices becoming overdue.`);

        for (const invoice of overdueInvoices) {
            await this.prisma.invoice.update({
                where: { id: invoice.id },
                data: { status: InvoiceStatus.OVERDUE },
            });

            if (invoice.project.clientId) {
                await this.notificationsService.create({
                    userId: invoice.project.clientId,
                    type: NotificationType.WARNING,
                    title: 'Invoice Overdue',
                    message: `Invoice #${invoice.invoiceNumber} for ${invoice.project.name} is overdue.`,
                    link: `/dashboard/invoices`, // Ideally specific invoice link
                });
            }
        }
    }
}
