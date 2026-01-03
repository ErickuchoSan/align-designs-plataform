import { Controller, Get, Post, Body, Param, Patch, Query, UseGuards, Res, StreamableFile } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { UserPayload } from '../auth/interfaces/user.interface';
import { Role, InvoiceStatus } from '@prisma/client';
import { InvoicePdfService } from './invoice-pdf.service';
import type { Response } from 'express';

@Controller('invoices')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InvoicesController {
    constructor(
        private readonly invoicesService: InvoicesService,
        private readonly invoicePdfService: InvoicePdfService,
    ) { }

    @Post()
    @Roles(Role.ADMIN)
    create(@Body() createInvoiceDto: CreateInvoiceDto) {
        return this.invoicesService.create(createInvoiceDto);
    }

    @Get()
    @Get()
    findAll(
        @CurrentUser() user: UserPayload,
        @Query('projectId') projectId?: string,
        @Query('clientId') clientId?: string
    ) {
        // If user is CLIENT, force clientId to be their ID
        const forcedClientId = user.role === Role.CLIENT ? user.userId : clientId;
        return this.invoicesService.findAll({ projectId, clientId: forcedClientId });
    }

    @Get('metrics')
    @Roles(Role.ADMIN)
    getMetrics() {
        return this.invoicesService.getMetrics();
    }

    @Get('project/:projectId/has-unpaid')
    @Roles(Role.ADMIN)
    async checkUnpaidInvoices(@Param('projectId') projectId: string) {
        const hasUnpaid = await this.invoicesService.hasUnpaidInvoices(projectId);
        return { hasUnpaidInvoices: hasUnpaid };
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        // TODO: Add ownership check for clients
        return this.invoicesService.findOne(id);
    }

    @Patch(':id/status')
    @Roles(Role.ADMIN)
    updateStatus(@Param('id') id: string, @Body('status') status: InvoiceStatus) {
        return this.invoicesService.updateStatus(id, status);
    }

    @Get(':id/pdf')
    async getInvoicePdf(
        @Param('id') id: string,
        @Res({ passthrough: true }) res: Response,
    ) {
        // Get invoice with all relations
        const invoice = await this.invoicesService.findOne(id);

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
