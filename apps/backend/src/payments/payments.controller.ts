import {
    Controller,
    Get,
    Post,
    Patch,
    Body,
    Param,
    UseInterceptors,
    UploadedFile,
    Query,
    UseGuards,
    ParseUUIDPipe,
    Req,
    BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PaymentsService } from './payments.service';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { StorageService } from '../storage/storage.service';

@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentsController {
    constructor(
        private readonly paymentsService: PaymentsService,
        private readonly storageService: StorageService,
    ) { }

    @Post()
    @Roles(Role.ADMIN, Role.CLIENT) // Client can pay, Admin can record
    @UseInterceptors(FileInterceptor('receiptFile'))
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
    findAllByProject(@Param('projectId', ParseUUIDPipe) projectId: string) {
        return this.paymentsService.findAllByProject(projectId);
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
    @UseInterceptors(FileInterceptor('receiptFile'))
    async uploadClientPayment(
        @Body() createPaymentDto: RecordPaymentDto,
        @UploadedFile() file: Express.Multer.File,
        @Req() req: any,
    ) {
        if (!file) {
            throw new BadRequestException('Receipt file is required');
        }

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
}
