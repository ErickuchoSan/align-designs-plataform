import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    UseInterceptors,
    UploadedFile,
    Query,
    UseGuards,
    ParseUUIDPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PaymentsService } from './payments.service';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { diskStorage } from 'multer';
import { extname } from 'path';

// Todo: Using disk storage temporarily or implement MinIO logic like FilesService
// For simplicity in this phase, assuming we might need to handle file upload either locally or just store URL if uploaded via pre-signed URL.
// The plan says "receiptFileUrl". Let's assume the client might upload receiving a URL, OR we handle upload here.
// Given existing FilesService uses MinIO, we should ideally use it.
// However, to avoid circular deps or complexity, let's keep it simple: 
// The client uploads file to /files/upload (generic) and gets a URL/ID, then passes it?
// OR we handle it here.
// Let's assume for now the DTO *could* take a file upload here. 
// I'll implement basic file handling saving to 'uploads/receipts' for now, or mock logic if MinIO is strictly required.
// Actually, I'll allow the file to be uploaded properly.

@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService) { }

    @Post()
    @Roles(Role.ADMIN, Role.CLIENT) // Client can pay, Admin can record
    @UseInterceptors(FileInterceptor('receiptFile', {
        storage: diskStorage({
            destination: './uploads/receipts',
            filename: (req, file, cb) => {
                const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
                return cb(null, `${randomName}${extname(file.originalname)}`);
            }
        })
    }))
    async create(
        @Body() createPaymentDto: RecordPaymentDto,
        @UploadedFile() file: Express.Multer.File,
    ) {
        // In a real app with MinIO, we'd upload there. 
        // For now, we store the local path or null.
        // We should probably check if the directory exists or rely on a robust FileService.
        const receiptUrl = file ? `/uploads/receipts/${file.filename}` : null;
        return this.paymentsService.create(createPaymentDto, receiptUrl || undefined);
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
}
