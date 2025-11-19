import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { Response } from 'express';

@Catch(ThrottlerException)
export class ThrottlerExceptionFilter implements ExceptionFilter {
  catch(exception: ThrottlerException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();

    // Calculate approximate wait time (throttler uses TTL, usually 60 seconds)
    const waitTimeSeconds = 60; // Default throttler TTL
    const waitTimeMinutes = Math.ceil(waitTimeSeconds / 60);

    response.status(status).json({
      statusCode: HttpStatus.TOO_MANY_REQUESTS,
      message: `Too many requests. Please wait ${waitTimeMinutes} minute${waitTimeMinutes !== 1 ? 's' : ''} before trying again.`,
      error: 'Too Many Requests',
    });
  }
}
