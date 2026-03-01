import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Res, UseInterceptors, UploadedFile, ParseUUIDPipe } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EmployeePaymentsService } from './employee-payments.service';
import { CreateEmployeePaymentDto } from './dto/create-employee-payment.dto';
import { UpdateEmployeePaymentDto } from './dto/update-employee-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { UserPayload } from '../auth/interfaces/user.interface';
import { Role } from '@prisma/client';

@ApiTags('Employee Payments')
@ApiBearerAuth()
@Controller('employee-payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EmployeePaymentsController {
    constructor(private readonly employeePaymentsService: EmployeePaymentsService) { }

    @Post()
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: 'Create employee payment (Admin only)' })
    create(
        @Body() createDto: CreateEmployeePaymentDto,
        @CurrentUser() user: UserPayload,
    ) {
        return this.employeePaymentsService.create(createDto, user.userId);
    }

    @Get()
    @Roles(Role.ADMIN, Role.EMPLOYEE)
    @ApiOperation({ summary: 'Get all employee payments (Admin sees all, Employee sees own)' })
    findAll(
        @CurrentUser() user: UserPayload,
        @Query('projectId') projectId?: string,
    ) {
        return this.employeePaymentsService.findAll(user.userId, user.role, projectId);
    }

    @Get('pending-items')
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: 'Get pending payment items for employee' })
    getPendingItems(
        @Query('projectId', ParseUUIDPipe) projectId: string,
        @Query('employeeId', ParseUUIDPipe) employeeId: string,
    ) {
        return this.employeePaymentsService.getPendingPaymentItems(projectId, employeeId);
    }

    @Get(':id')
    @Roles(Role.ADMIN, Role.EMPLOYEE)
    @ApiOperation({ summary: 'Get one employee payment' })
    findOne(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() user: UserPayload,
    ) {
        return this.employeePaymentsService.findOne(id, user.userId, user.role);
    }

    @Patch(':id')
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: 'Update employee payment (Admin only, only PENDING)' })
    update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateDto: UpdateEmployeePaymentDto,
        @CurrentUser() user: UserPayload,
    ) {
        return this.employeePaymentsService.update(id, updateDto, user.userId);
    }

    @Patch(':id/approve')
    @Roles(Role.ADMIN)
    @UseInterceptors(FileInterceptor('receiptFile'))
    @ApiOperation({ summary: 'Approve employee payment (Admin only)' })
    approve(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() user: UserPayload,
        @UploadedFile() file: Express.Multer.File,
    ) {
        return this.employeePaymentsService.approve(id, user.userId, file);
    }

    @Patch(':id/reject')
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: 'Reject employee payment (Admin only)' })
    reject(
        @Param('id', ParseUUIDPipe) id: string,
        @Body('rejectionReason') rejectionReason: string,
        @CurrentUser() user: UserPayload,
    ) {
        return this.employeePaymentsService.reject(id, rejectionReason, user.userId);
    }

    @Delete(':id')
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: 'Delete employee payment (Admin only, only PENDING/REJECTED)' })
    remove(@Param('id', ParseUUIDPipe) id: string) {
        return this.employeePaymentsService.remove(id);
    }

    @Get(':id/receipt-url')
    @Roles(Role.ADMIN, Role.EMPLOYEE)
    @ApiOperation({ summary: 'Get receipt URL' })
    async getReceiptUrl(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() user: UserPayload,
    ) {
        const url = await this.employeePaymentsService.getReceiptDownloadUrl(id, user.userId, user.role);
        return { url };
    }

    @Get(':id/receipt')
    @Roles(Role.ADMIN, Role.EMPLOYEE)
    @ApiOperation({ summary: 'Redirect to receipt' })
    async redirectReceipt(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() user: UserPayload,
        @Res() res: Response,
    ) {
        const url = await this.employeePaymentsService.getReceiptDownloadUrl(id, user.userId, user.role);
        return res.redirect(url);
    }
}
