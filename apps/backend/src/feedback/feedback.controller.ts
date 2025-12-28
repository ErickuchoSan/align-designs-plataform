import { Controller } from '@nestjs/common';
import { FeedbackService } from './feedback.service';

/**
 * Feedback Controller
 *
 * Handles HTTP endpoints for feedback cycles and feedback entries.
 * Will be populated with endpoints in the controller update phase.
 */
@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  // Endpoints will be added when updating controllers
}
