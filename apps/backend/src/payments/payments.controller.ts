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
  UseGuards,
  ParseUUIDPipe,
  Req,
  Res,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import type { Response, Request } from 'express';

/**
 * Multipart form body fields for client payment upload
 * All fields are strings because multipart/form-data serializes everything as strings
 */
interface ClientPaymentBody {
  projectId?: string;
  amount?: string;
  paymentDate?: string;
  paymentMethod?: string;
  type?: string;
  notes?: string;
  invoiceId?: string;
}
import { FileInterceptor, AnyFilesInterceptor } from '@nestjs/platform-express';
import { PaymentsService } from './payments.service';
import { zodPipe } from '../common/pipes/zod-validation.pipe';
import {
  RecordPaymentSchema,
  type RecordPaymentDto,
  ApprovePaymentSchema,
  type ApprovePaymentDto,
  RejectPaymentSchema,
  type RejectPaymentDto,
} from './schemas';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { UserPayload } from '../auth/interfaces/user.interface';
import { Role, PaymentType } from '@prisma/client';
import { StorageService } from '../storage/storage.service';
import { InvoicesService } from '../invoices/invoices.service';
import { IdempotencyInterceptor } from '../common/interceptors/idempotency.interceptor';

@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly storageService: StorageService,
    private readonly invoicesService: InvoicesService,
  ) {}

  @Post()
  @Roles(Role.ADMIN, Role.CLIENT)
  @UseInterceptors(
    IdempotencyInterceptor,
    FileInterceptor('receiptFile', {
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
      },
    }),
  )
  async create(
    @Body(zodPipe(RecordPaymentSchema)) createPaymentDto: RecordPaymentDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    let receiptStoragePath: string | undefined;

    if (file) {
      const uploadResult = await this.storageService.uploadFile(
        file,
        createPaymentDto.projectId,
      );
      receiptStoragePath = uploadResult.storagePath;
    }

    return this.paymentsService.create(createPaymentDto, receiptStoragePath);
  }

  @Get('project/:projectId')
  @Roles(Role.ADMIN, Role.CLIENT, Role.EMPLOYEE)
  findAllByProject(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @CurrentUser() user: UserPayload,
  ) {
    return this.paymentsService.findAllByProject(
      projectId,
      user.userId,
      user.role,
    );
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
   *
   * Idempotency: Uses Idempotency-Key header to prevent duplicate uploads
   */
  @Post('client-upload')
  @Roles(Role.CLIENT)
  @UseInterceptors(
    IdempotencyInterceptor,
    AnyFilesInterceptor({
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
        fields: 20, // Allow up to 20 form fields
      },
    }),
  )
  async uploadClientPayment(
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: Request & { body: ClientPaymentBody },
    @CurrentUser() user: UserPayload,
  ) {
    const file = files && files.length > 0 ? files[0] : null;

    if (!file) {
      throw new BadRequestException('Receipt file is required');
    }

    // Extract fields from multipart form data
    const { amount, paymentDate, paymentMethod, notes, invoiceId } = req.body;
    let { projectId, type } = req.body;

    // If projectId is missing but invoiceId exists, fetch it from the invoice
    // Using InvoicesService to follow Law of Demeter
    if (!projectId && invoiceId) {
      projectId = await this.invoicesService.getProjectIdByInvoiceId(invoiceId);
      if (!projectId) {
        throw new BadRequestException('Invalid invoiceId provided');
      }
    }

    // Fail fast validation
    if (!projectId || !amount || !paymentDate || !paymentMethod) {
      throw new BadRequestException(
        `Missing required fields. Received: projectId=${projectId}, amount=${amount}, paymentDate=${paymentDate}, paymentMethod=${paymentMethod}`,
      );
    }

    // Infer type if not provided
    if (!type) {
      type = invoiceId ? PaymentType.INVOICE : PaymentType.INITIAL_PAYMENT;
    }

    // Build DTO
    const createPaymentDto: RecordPaymentDto = {
      projectId,
      type: type as RecordPaymentDto['type'],
      amount: Number.parseFloat(amount),
      paymentMethod: paymentMethod as RecordPaymentDto['paymentMethod'],
      paymentDate,
      notes,
      invoiceId,
    };

    // Upload receipt to storage
    const uploadResult = await this.storageService.uploadFile(
      file,
      createPaymentDto.projectId,
    );

    this.logger.log(
      `Client ${user.userId} uploading payment for project ${projectId}`,
    );

    return this.paymentsService.createClientPayment(
      createPaymentDto,
      uploadResult.storagePath,
      user.userId,
    );
  }

  /**
   * Admin approves payment
   * Can optionally correct the amount
   *
   * Idempotency: Uses Idempotency-Key header to prevent double approval
   */
  @Patch(':id/approve')
  @Roles(Role.ADMIN)
  @UseInterceptors(IdempotencyInterceptor)
  async approvePayment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(zodPipe(ApprovePaymentSchema)) approveDto: ApprovePaymentDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.paymentsService.approvePayment(
      id,
      user.userId,
      approveDto.correctedAmount,
    );
  }

  /**
   * Admin rejects payment
   * Requires rejection reason (validated by DTO)
   */
  @Patch(':id/reject')
  @Roles(Role.ADMIN)
  async rejectPayment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(zodPipe(RejectPaymentSchema)) rejectDto: RejectPaymentDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.paymentsService.rejectPayment(
      id,
      user.userId,
      rejectDto.rejectionReason,
    );
  }

  /**
   * Get presigned URL for viewing payment receipt
   * Returns a temporary MinIO URL to access the receipt file
   */
  @Get(':id/receipt-url')
  @Roles(Role.ADMIN, Role.CLIENT)
  async getReceiptUrl(@Param('id', ParseUUIDPipe) id: string) {
    const presignedUrl = await this.paymentsService.getReceiptDownloadUrl(id);
    return {
      url: presignedUrl,
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
