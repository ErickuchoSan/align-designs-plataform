import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Req, Res, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EmployeePaymentsService } from './employee-payments.service';
import { CreateEmployeePaymentDto } from './dto/create-employee-payment.dto';
import { UpdateEmployeePaymentDto } from './dto/update-employee-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Employee Payments')
@ApiBearerAuth()
@Controller('employee-payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EmployeePaymentsController {
  constructor(private readonly employeePaymentsService: EmployeePaymentsService) { }
  // Force rebuild

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create employee payment (Admin only)' })
  create(@Body() createDto: CreateEmployeePaymentDto, @Req() req: any) {
    return this.employeePaymentsService.create(createDto, req.user.userId);
  }

  @Get()
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @ApiOperation({ summary: 'Get all employee payments (Admin sees all, Employee sees own)' })
  findAll(@Req() req: any, @Query('projectId') projectId?: string) {
    return this.employeePaymentsService.findAll(req.user.userId, req.user.role, projectId);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @ApiOperation({ summary: 'Get one employee payment' })
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.employeePaymentsService.findOne(id, req.user.userId, req.user.role);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update employee payment (Admin only, only PENDING)' })
  update(@Param('id') id: string, @Body() updateDto: UpdateEmployeePaymentDto, @Req() req: any) {
    return this.employeePaymentsService.update(id, updateDto, req.user.userId);
  }

  @Patch(':id/approve')
  @Roles(Role.ADMIN)
  @UseInterceptors(FileInterceptor('receiptFile'))
  @ApiOperation({ summary: 'Approve employee payment (Admin only)' })
  approve(
    @Param('id') id: string,
    @Req() req: any,
    @UploadedFile() file: Express.Multer.File
  ) {
    return this.employeePaymentsService.approve(id, req.user.userId, file);
  }

  @Patch(':id/reject')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Reject employee payment (Admin only)' })
  reject(@Param('id') id: string, @Body('rejectionReason') rejectionReason: string, @Req() req: any) {
    return this.employeePaymentsService.reject(id, rejectionReason, req.user.userId);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete employee payment (Admin only, only PENDING/REJECTED)' })
  remove(@Param('id') id: string) {
    return this.employeePaymentsService.remove(id);
  }

  @Get(':id/receipt-url')
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @ApiOperation({ summary: 'Get receipt URL' })
  async getReceiptUrl(
    @Param('id') id: string,
    @Req() req: any
  ) {
    const url = await this.employeePaymentsService.getReceiptDownloadUrl(id, req.user.userId, req.user.role);
    return { url };
  }

  @Get(':id/receipt')
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @ApiOperation({ summary: 'Redirect to receipt' })
  async redirectReceipt(
    @Param('id') id: string,
    @Req() req: any,
    @Res() res: Response
  ) {
    const url = await this.employeePaymentsService.getReceiptDownloadUrl(id, req.user.userId, req.user.role);
    // The original code had a misplaced endpoint here. It has been moved.
  }

  @Get('pending-items')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get pending payment items for employee' })
  getPendingItems(
    @Query('projectId') projectId: string,
    @Query('employeeId') employeeId: string
  ) {
    return this.employeePaymentsService.getPendingPaymentItems(projectId, employeeId);
  }
}
