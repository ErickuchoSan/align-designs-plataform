import { Module } from '@nestjs/common';
import { EmployeePaymentsService } from './employee-payments.service';
import { EmployeePaymentsController } from './employee-payments.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [PrismaModule, AuthModule, StorageModule],
  controllers: [EmployeePaymentsController],
  providers: [EmployeePaymentsService],
  exports: [EmployeePaymentsService],
})
export class EmployeePaymentsModule { }
