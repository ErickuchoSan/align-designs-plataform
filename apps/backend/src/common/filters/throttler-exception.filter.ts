import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { Response } from 'express';
import { GLOBAL_RATE_LIMIT } from '../constants/timeouts.constants';

@Catch(ThrottlerException)
export class ThrottlerExceptionFilter implements ExceptionFilter {
  catch(exception: ThrottlerException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();

    // Calculate wait time based on configured TTL
    const waitTimeMs = GLOBAL_RATE_LIMIT.ttl;
    const waitTimeSeconds = Math.ceil(waitTimeMs / 1000);
    const waitTimeMinutes = Math.ceil(waitTimeSeconds / 60);

    response.status(status).json({
      statusCode: HttpStatus.TOO_MANY_REQUESTS,
      message: `Too many requests. Please wait ${waitTimeMinutes} minute${waitTimeMinutes !== 1 ? 's' : ''} before trying again.`,
      error: 'Too Many Requests',
    });
  }
}
