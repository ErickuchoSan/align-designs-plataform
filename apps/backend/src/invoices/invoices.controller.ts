import { Controller, Get, Post, Body, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { UserPayload } from '../auth/interfaces/user.interface';
import { Role, InvoiceStatus } from '@prisma/client';

@Controller('invoices')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InvoicesController {
    constructor(private readonly invoicesService: InvoicesService) { }

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
}
