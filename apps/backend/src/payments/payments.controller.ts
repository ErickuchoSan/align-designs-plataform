import {
    Controller,
    Get,
    Post,
    Patch,
    Body,
    Param,
    UseInterceptors,
    UploadedFile,
    UploadedFiles,
    Query,
    UseGuards,
    ParseUUIDPipe,
    Req,
    Res,
    BadRequestException,
    UsePipes,
    ValidationPipe,
} from '@nestjs/common';
import type { Response } from 'express';
import { FileInterceptor, AnyFilesInterceptor } from '@nestjs/platform-express';
import { PaymentsService } from './payments.service';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { StorageService } from '../storage/storage.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentsController {
    constructor(
        private readonly paymentsService: PaymentsService,
        private readonly storageService: StorageService,
        private readonly prisma: PrismaService,
    ) { }

    @Post()
    @Roles(Role.ADMIN, Role.CLIENT) // Client can pay, Admin can record
    @UseInterceptors(FileInterceptor('receiptFile', {
        limits: {
            fileSize: 5 * 1024 * 1024, // 5MB limit
        },
    }))
    async create(
        @Body() createPaymentDto: RecordPaymentDto,
        @UploadedFile() file: Express.Multer.File,
    ) {
        let receiptStoragePath: string | undefined;

        if (file) {
            const uploadResult = await this.storageService.uploadFile(file, createPaymentDto.projectId);
            receiptStoragePath = uploadResult.storagePath;
        }

        return this.paymentsService.create(createPaymentDto, receiptStoragePath);
    }

    @Get('project/:projectId')
    @Roles(Role.ADMIN, Role.CLIENT, Role.EMPLOYEE)
    findAllByProject(
        @Param('projectId', ParseUUIDPipe) projectId: string,
        @Req() req: any,
    ) {
        const userId = req.user.userId;
        const userRole = req.user.role;
        return this.paymentsService.findAllByProject(projectId, userId, userRole);
    }

    @Get(':id')
    @Roles(Role.ADMIN)
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.paymentsService.findOne(id);
    }

    /**
     * Client uploads payment receipt
     * Creates payment with PENDING_APPROVAL status
     * Notifies admin for review
     */
    @Post('client-upload')
    @Roles(Role.CLIENT)
    @UseInterceptors(AnyFilesInterceptor({
        limits: {
            fileSize: 5 * 1024 * 1024, // 5MB limit
            fields: 20, // Allow up to 20 form fields
        },
    }))
    async uploadClientPayment(
        @UploadedFiles() files: Express.Multer.File[],
        @Req() req: any,
    ) {
        // Debug logging
        console.log('=== CLIENT PAYMENT UPLOAD DEBUG ===');
        console.log('Files received:', files ? files.length : 0);
        if (files && files.length > 0) {
            files.forEach((f, i) => {
                console.log(`File ${i}:`, {
                    fieldname: f.fieldname,
                    originalname: f.originalname,
                    mimetype: f.mimetype,
                    size: f.size,
                });
            });
        }
        console.log('Body keys:', Object.keys(req.body));
        console.log('Body values:', req.body);
        console.log('===================================');

        const file = files && files.length > 0 ? files[0] : null;

        if (!file) {
            throw new BadRequestException('Receipt file is required');
        }

        // Manually extract and validate fields from req.body
        let { projectId, amount, paymentDate, paymentMethod, type, notes, invoiceId } = req.body;

        console.log('Extracted fields:', { projectId, amount, paymentDate, paymentMethod, type, notes, invoiceId });

        // If projectId is missing but invoiceId exists, fetch it from the invoice
        if (!projectId && invoiceId) {
            const invoice = await this.prisma.invoice.findUnique({
                where: { id: invoiceId },
                select: { projectId: true },
            });
            if (!invoice) {
                throw new BadRequestException('Invalid invoiceId provided');
            }
            projectId = invoice.projectId;
            console.log('ProjectId fetched from invoice:', projectId);
        }

        if (!projectId || !amount || !paymentDate || !paymentMethod) {
            throw new BadRequestException(`Missing required fields. Received: projectId=${projectId}, amount=${amount}, paymentDate=${paymentDate}, paymentMethod=${paymentMethod}`);
        }

        // Infer type if not provided
        if (!type) {
            type = invoiceId ? 'INVOICE' : 'INITIAL_PAYMENT';
            console.log('Type inferred:', type);
        }

        // Build DTO manually
        const createPaymentDto: RecordPaymentDto = {
            projectId,
            type,
            amount: parseFloat(amount),
            paymentMethod,
            paymentDate,
            notes,
            invoiceId,
        };

        console.log('Final DTO:', createPaymentDto);

        // Upload receipt to MinIO
        const uploadResult = await this.storageService.uploadFile(file, createPaymentDto.projectId);
        const userId = req.user.userId;

        return this.paymentsService.createClientPayment(
            createPaymentDto,
            uploadResult.storagePath,
            userId,
        );
    }

    /**
     * Admin approves payment
     * Can optionally correct the amount
     */
    @Patch(':id/approve')
    @Roles(Role.ADMIN)
    async approvePayment(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() body: { correctedAmount?: number },
        @Req() req: any,
    ) {
        const adminId = req.user.userId;
        return this.paymentsService.approvePayment(id, adminId, body.correctedAmount);
    }

    /**
     * Admin rejects payment
     * Requires rejection reason
     */
    @Patch(':id/reject')
    @Roles(Role.ADMIN)
    async rejectPayment(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() body: { rejectionReason: string },
        @Req() req: any,
    ) {
        if (!body.rejectionReason || body.rejectionReason.trim().length === 0) {
            throw new BadRequestException('Rejection reason is required');
        }

        const adminId = req.user.userId;
        return this.paymentsService.rejectPayment(id, adminId, body.rejectionReason);
    }

    /**
     * Get presigned URL for viewing payment receipt
     * Returns a temporary MinIO URL to access the receipt file
     */
    @Get(':id/receipt-url')
    @Roles(Role.ADMIN, Role.CLIENT)
    async getReceiptUrl(
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        const presignedUrl = await this.paymentsService.getReceiptDownloadUrl(id);
        return {
            url: presignedUrl
        };
    }

    /**
     * Redirect to the payment receipt
     * Useful for direct links in frontend
     */
    @Get(':id/receipt')
    @Roles(Role.ADMIN, Role.CLIENT)
    async redirectReceipt(
        @Param('id', ParseUUIDPipe) id: string,
        @Res() res: Response,
    ) {
        const presignedUrl = await this.paymentsService.getReceiptDownloadUrl(id);
        return res.redirect(presignedUrl);
    }
}
