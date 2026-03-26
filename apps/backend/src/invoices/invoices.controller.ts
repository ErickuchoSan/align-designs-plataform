import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Query,
  UseGuards,
  UseInterceptors,
  Res,
  StreamableFile,
  ForbiddenException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { zodPipe } from '../common/pipes/zod-validation.pipe';
import { CreateInvoiceSchema, type CreateInvoiceDto } from './schemas';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { UserPayload } from '../auth/interfaces/user.interface';
import { Role, InvoiceStatus } from '@prisma/client';
import { InvoicePdfService } from './invoice-pdf.service';
import { IdempotencyInterceptor } from '../common/interceptors/idempotency.interceptor';
import type { Response } from 'express';

@Controller('invoices')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InvoicesController {
  constructor(
    private readonly invoicesService: InvoicesService,
    private readonly invoicePdfService: InvoicePdfService,
  ) {}

  @Post()
  @Roles(Role.ADMIN)
  @UseInterceptors(IdempotencyInterceptor)
  create(@Body(zodPipe(CreateInvoiceSchema)) createInvoiceDto: CreateInvoiceDto) {
    return this.invoicesService.create(createInvoiceDto);
  }

  @Post(':id/resend')
  @Roles(Role.ADMIN)
  async resendEmail(@Param('id', ParseUUIDPipe) id: string) {
    await this.invoicesService.resendInvoiceEmail(id);
    return { message: 'Invoice email queued for sending' };
  }

  @Get()
  findAll(
    @CurrentUser() user: UserPayload,
    @Query('projectId') projectId?: string,
    @Query('clientId') clientId?: string,
  ) {
    // If user is CLIENT, force clientId to be their ID
    const forcedClientId = user.role === Role.CLIENT ? user.userId : clientId;
    return this.invoicesService.findAll({
      projectId,
      clientId: forcedClientId,
    });
  }

  @Get('metrics')
  @Roles(Role.ADMIN)
  getMetrics() {
    return this.invoicesService.getMetrics();
  }

  @Get('project/:projectId/has-unpaid')
  @Roles(Role.ADMIN)
  async checkUnpaidInvoices(
    @Param('projectId', ParseUUIDPipe) projectId: string,
  ) {
    const hasUnpaid = await this.invoicesService.hasUnpaidInvoices(projectId);
    return { hasUnpaidInvoices: hasUnpaid };
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: UserPayload,
  ) {
    const invoice = await this.invoicesService.findOne(id);

    // Ownership check: Clients can only view their own invoices
    if (user.role === Role.CLIENT && invoice.clientId !== user.userId) {
      throw new ForbiddenException('You do not have access to this invoice');
    }

    return invoice;
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN)
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: InvoiceStatus,
  ) {
    return this.invoicesService.updateStatus(id, status);
  }

  @Get(':id/pdf')
  async getInvoicePdf(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: UserPayload,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Get invoice with all relations
    const invoice = await this.invoicesService.findOne(id);

    // Ownership check: Clients can only view their own invoice PDFs
    if (user.role === Role.CLIENT && invoice.clientId !== user.userId) {
      throw new ForbiddenException('You do not have access to this invoice');
    }

    // Generate PDF
    const pdfBuffer = await this.invoicePdfService.generateInvoicePDF(invoice);

    // Set headers for PDF download
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="Invoice-${invoice.invoiceNumber}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });

    return new StreamableFile(pdfBuffer);
  }
}
