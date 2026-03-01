import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ProjectsModule } from '../projects/projects.module';
import { AuthModule } from '../auth/auth.module';
import { StorageModule } from '../storage/storage.module';
import { InvoicesModule } from '../invoices/invoices.module';
import { PaymentApprovalService } from './services/payment-approval.service';

@Module({
    imports: [PrismaModule, ProjectsModule, AuthModule, StorageModule, InvoicesModule],
    controllers: [PaymentsController],
    providers: [PaymentsService, PaymentApprovalService],
    exports: [PaymentsService, PaymentApprovalService],
})
export class PaymentsModule { }
