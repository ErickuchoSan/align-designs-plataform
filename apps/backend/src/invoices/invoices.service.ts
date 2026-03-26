import {
  Injectable,
  NotFoundException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateInvoiceDto } from './schemas';
import {
  InvoiceStatus,
  Invoice,
  NotificationType,
  Prisma,
} from '@prisma/client';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationsService } from '../notifications/notifications.service';
import { InvoicePdfService } from './invoice-pdf.service';
import { EmailService } from '../email/email.service';
import { DEFAULT_PAYMENT_TERMS_DAYS } from '../common/constants/business.constants';

/**
 * Invoice type with client, project, and payments relations included
 */
type InvoiceWithRelations = Prisma.InvoiceGetPayload<{
  include: { project: true; client: true; payments: true };
}>;

@Injectable()
export class InvoicesService {
  private readonly logger = new Logger(InvoicesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly invoicePdfService: InvoicePdfService,
    private readonly emailService: EmailService,
  ) {}

  async create(data: CreateInvoiceDto): Promise<Invoice> {
    // Check if there are pending invoices for this project
    const pendingInvoices = await this.prisma.invoice.findMany({
      where: {
        projectId: data.projectId,
        status: {
          in: [InvoiceStatus.SENT, InvoiceStatus.OVERDUE, InvoiceStatus.DRAFT],
        },
      },
    });

    // Check if any pending invoice has an unpaid balance
    const hasUnpaidInvoice = pendingInvoices.some(
      (inv) => Number(inv.totalAmount) > Number(inv.amountPaid),
    );

    if (hasUnpaidInvoice) {
      throw new BadRequestException(
        'Cannot create a new invoice while there are unpaid invoices for this project. Please ensure all previous invoices are fully paid before generating a new one.',
      );
    }

    const invoiceNumber = await this.generateInvoiceNumber();

    const invoice = await this.prisma.invoice.create({
      data: {
        ...data,
        invoiceNumber,
        status: InvoiceStatus.DRAFT,
        amountPaid: 0, // Ensure initial amount paid is 0
        taxAmount: data.taxAmount || 0,
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
      `Invoice ${invoiceNumber} created manually for project ${data.projectId}, amount: $${data.totalAmount}`,
    );

    // Generate PDF and send email to client
    try {
      // Get full invoice data with all relations for PDF generation (re-fetching generally safer for consistency)
      const fullInvoice = await this.findOne(invoice.id);

      // Generate PDF
      this.logger.log(`Generating PDF for invoice ${invoiceNumber}...`);
      // Creates a copy of the invoice with status SENT for the PDF
      const invoiceForPdf = {
        ...fullInvoice,
        status: InvoiceStatus.SENT,
      } as unknown as Invoice; // Cast to Invoice since structure allows it
      const pdfBuffer =
        await this.invoicePdfService.generateInvoicePDF(invoiceForPdf);
      this.logger.log(
        `PDF generated successfully. Size: ${pdfBuffer.length} bytes.`,
      );

      // Send email with PDF attachment
      const clientName = `${invoice.client.firstName} ${invoice.client.lastName}`;
      this.logger.log(
        `Sending email to ${invoice.client.email} with attachment...`,
      );

      await this.emailService.sendInvoiceEmail(
        invoice.client.email,
        clientName,
        invoiceNumber,
        Number(data.totalAmount),
        new Date(data.dueDate),
        pdfBuffer,
      );

      // Update invoice status to SENT
      await this.updateStatus(invoice.id, InvoiceStatus.SENT);

      this.logger.log(
        `Invoice ${invoiceNumber} PDF generated and email sent to ${invoice.client.email}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to generate PDF or send email for invoice ${invoiceNumber}. Error: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : String(error),
      );
      // Don't throw - user can resend later
    }

    return this.transformInvoiceDecimals(invoice) as Invoice;
  }

  async findAll(filters: { projectId?: string; clientId?: string }) {
    const invoices = await this.prisma.invoice.findMany({
      where: filters,
      include: {
        project: { select: { name: true } },
        client: { select: { firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Transform Decimal fields to numbers for JSON serialization
    return invoices.map((inv) => this.transformInvoiceDecimals(inv));
  }

  /**
   * Transform Prisma Decimal fields to numbers for proper JSON serialization
   */
  private transformInvoiceDecimals<
    T extends {
      subtotal: unknown;
      taxAmount: unknown;
      totalAmount: unknown;
      amountPaid: unknown;
    },
  >(
    invoice: T,
  ): T & {
    subtotal: number;
    taxAmount: number;
    totalAmount: number;
    amountPaid: number;
  } {
    return {
      ...invoice,
      subtotal: Number(invoice.subtotal),
      taxAmount: Number(invoice.taxAmount),
      totalAmount: Number(invoice.totalAmount),
      amountPaid: Number(invoice.amountPaid),
    };
  }

  async findOne(id: string): Promise<InvoiceWithRelations> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        project: true,
        client: true,
        payments: true,
      },
    });

    if (!invoice) throw new NotFoundException('Invoice not found');
    return this.transformInvoiceDecimals(invoice);
  }

  /**
   * Get project ID by invoice ID
   * Used to resolve projectId when only invoiceId is provided
   * Follows Law of Demeter - controllers should not access Prisma directly
   */
  async getProjectIdByInvoiceId(invoiceId: string): Promise<string | null> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: { projectId: true },
    });
    return invoice?.projectId ?? null;
  }

  async updateStatus(id: string, status: InvoiceStatus): Promise<Invoice> {
    const data: { status: InvoiceStatus; sentToClientAt?: Date } = { status };
    if (status === InvoiceStatus.SENT) {
      data.sentToClientAt = new Date();
    }
    const invoice = await this.prisma.invoice.update({
      where: { id },
      data,
    });
    return this.transformInvoiceDecimals(invoice) as Invoice;
  }

  /**
   * Auto-generate invoice when project is created with initialAmountRequired
   * Called from ProjectsService.create()
   */
  async createInvoiceForProject(
    projectId: string,
    clientId: string,
    amount: number,
    paymentTermsDays: number = DEFAULT_PAYMENT_TERMS_DAYS,
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

    // Link existing INITIAL_PAYMENT payments to this invoice
    const existingPayments = await this.prisma.payment.findMany({
      where: {
        projectId,
        type: 'INITIAL_PAYMENT',
        status: 'CONFIRMED',
        invoiceId: null, // Not yet linked to any invoice
      },
    });

    if (existingPayments.length > 0) {
      const totalExistingPayments = existingPayments.reduce(
        (sum, p) => sum + Number(p.amount),
        0,
      );

      // Link payments to invoice
      await this.prisma.payment.updateMany({
        where: {
          id: { in: existingPayments.map((p) => p.id) },
        },
        data: {
          invoiceId: invoice.id,
        },
      });

      // Update invoice amountPaid and status
      const newAmountPaid = totalExistingPayments;
      let newStatus = invoice.status;
      if (newAmountPaid >= amount) {
        newStatus = InvoiceStatus.PAID;
      } else if (newAmountPaid > 0) {
        newStatus = 'PARTIALLY_PAID' as InvoiceStatus;
      }

      await this.prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          amountPaid: newAmountPaid,
          status: newStatus,
        },
      });

      this.logger.log(
        `Linked ${existingPayments.length} existing payments (total: $${totalExistingPayments}) to invoice ${invoiceNumber}. Updated status to ${newStatus}`,
      );
    }

    // Generate PDF and send email to client
    try {
      // Get full invoice data with all relations for PDF generation
      const fullInvoice = await this.findOne(invoice.id);

      // Generate PDF
      this.logger.log(`Generating PDF for invoice ${invoiceNumber}...`);
      // Creates a copy of the invoice with status SENT for the PDF
      const invoiceForPdf = { ...fullInvoice, status: InvoiceStatus.SENT };
      const pdfBuffer =
        await this.invoicePdfService.generateInvoicePDF(invoiceForPdf);
      this.logger.log(
        `PDF generated successfully. Size: ${pdfBuffer.length} bytes.`,
      );

      // Send email with PDF attachment
      const clientName = `${invoice.client.firstName} ${invoice.client.lastName}`;
      this.logger.log(
        `Sending email to ${invoice.client.email} with attachment...`,
      );

      await this.emailService.sendInvoiceEmail(
        invoice.client.email,
        clientName,
        invoiceNumber,
        amount,
        dueDate,
        pdfBuffer,
      );

      // Update invoice status to SENT
      await this.updateStatus(invoice.id, InvoiceStatus.SENT);

      this.logger.log(
        `Invoice ${invoiceNumber} PDF generated and email sent to ${invoice.client.email}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to generate PDF or send email for invoice ${invoiceNumber}. Error: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : String(error),
      );
      if (error && typeof error === 'object') {
        this.logger.error('Full error object:', JSON.stringify(error, null, 2));
      }
      // Don't throw - invoice is created, email is a nice-to-have
      // Admin can manually resend later
    }

    return this.transformInvoiceDecimals(invoice) as Invoice;
  }

  /**
   * Manually resend invoice email
   * Throws error if email sending fails, allowing admin to see the reason
   */
  async resendInvoiceEmail(id: string): Promise<void> {
    const invoice = await this.findOne(id);
    const invoiceNumber = invoice.invoiceNumber;
    const amount = Number(invoice.totalAmount);

    this.logger.log(
      `Resending invoice ${invoiceNumber} email to ${invoice.client.email}`,
    );

    // Generate PDF
    // Ensure PDF shows "Sent" status even if currently Draft
    const invoiceForPdf = { ...invoice, status: InvoiceStatus.SENT };
    const pdfBuffer =
      await this.invoicePdfService.generateInvoicePDF(invoiceForPdf);

    // Send email with PDF attachment
    const clientName = `${invoice.client.firstName} ${invoice.client.lastName}`;
    await this.emailService.sendInvoiceEmail(
      invoice.client.email,
      clientName,
      invoiceNumber,
      amount,
      invoice.dueDate,
      pdfBuffer,
    );

    // Update invoice status to SENT if it wasn't already (or PAID/OVERDUE)
    if (invoice.status === InvoiceStatus.DRAFT) {
      await this.updateStatus(invoice.id, InvoiceStatus.SENT);
    }

    this.logger.log(
      `Invoice ${invoiceNumber} email resent successfully to ${invoice.client.email}`,
    );
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
      const lastSeq = Number.parseInt(parts[parts.length - 1]);
      if (!Number.isNaN(lastSeq)) sequence = lastSeq + 1;
    }

    return `${prefix}-${String(sequence).padStart(3, '0')}`;
  }

  async getMetrics() {
    const totalSent = await this.prisma.invoice.count({
      where: { status: InvoiceStatus.SENT },
    });
    const totalPaid = await this.prisma.invoice.count({
      where: { status: InvoiceStatus.PAID },
    });
    const totalOverdue = await this.prisma.invoice.count({
      where: { status: InvoiceStatus.OVERDUE },
    });

    const revenue = await this.prisma.invoice.aggregate({
      where: { status: InvoiceStatus.PAID },
      _sum: { totalAmount: true },
    });

    return {
      totalSent,
      totalPaid,
      totalOverdue,
      totalRevenue: revenue._sum.totalAmount || 0,
    };
  }

  /**
   * Check if a project has any unpaid invoices
   * Returns true if there are invoices with pending balance
   */
  async hasUnpaidInvoices(projectId: string): Promise<boolean> {
    const pendingInvoices = await this.prisma.invoice.findMany({
      where: {
        projectId,
        status: {
          in: [InvoiceStatus.SENT, InvoiceStatus.OVERDUE, InvoiceStatus.DRAFT],
        },
      },
    });

    return pendingInvoices.some(
      (inv) => Number(inv.totalAmount) > Number(inv.amountPaid),
    );
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

    this.logger.log(
      `Found ${overdueInvoices.length} invoices becoming overdue.`,
    );

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
