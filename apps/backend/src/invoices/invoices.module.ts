import { Module } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { InvoicesController } from './invoices.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuthModule } from '../auth/auth.module';
import { InvoicePdfService } from './invoice-pdf.service';
import { EmailModule } from '../email/email.module';

@Module({
    imports: [PrismaModule, NotificationsModule, AuthModule, EmailModule],
    controllers: [InvoicesController],
    providers: [InvoicesService, InvoicePdfService],
    exports: [InvoicesService],
})
export class InvoicesModule { }
