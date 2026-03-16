import { Module } from '@nestjs/common';
import { TimeTrackingService } from './time-tracking.service';
import { TrackingController } from './tracking.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [TrackingController],
  providers: [TimeTrackingService],
  exports: [TimeTrackingService],
})
export class TrackingModule {}
