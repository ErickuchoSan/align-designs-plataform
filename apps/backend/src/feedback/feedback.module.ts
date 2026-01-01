import { Module } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { FeedbackController } from './feedback.controller';
import { PrismaModule } from '../prisma/prisma.module';

/**
 * Feedback Module
 *
 * Manages feedback cycles and feedback entries for projects.
 * Implements the 12PM time tracking rule for feedback cycles.
 *
 * Features:
 * - Create and manage feedback cycles
 * - Add feedback to cycles (client_space and employee_space)
 * - Submit, approve, and reject cycles
 * - Calculate time elapsed for performance tracking
 */
@Module({
  imports: [PrismaModule],
  providers: [FeedbackService],
  controllers: [FeedbackController],
  exports: [FeedbackService],
})
export class FeedbackModule {}
