import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

export interface ErrorResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  message: string | string[];
  error?: string;
  requestId?: string;
}

/**
 * Global HTTP Exception Filter
 * Standardizes error responses across the entire application
 * Provides consistent error format and logging
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('HttpExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const isProduction = process.env.NODE_ENV === 'production';

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error = 'Internal Server Error';
    let originalMessage = message; // Keep original for logging

    // Handle HttpException instances
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
        error = exception.name;
        originalMessage = message;
      } else if (typeof exceptionResponse === 'object') {
        const resp = exceptionResponse as {
          message?: string | string[];
          error?: string;
          statusCode?: number;
        };
        message = resp.message || message;
        error = resp.error || exception.name;
        originalMessage = Array.isArray(message) ? message.join(', ') : message;
      }
    }
    // Handle other errors (unexpected errors)
    else if (exception instanceof Error) {
      originalMessage = exception.message;
      message = exception.message;
      error = exception.name;
    }

    // Sanitize error messages in production for server errors (5xx)
    // to prevent exposing internal details like database errors, stack traces, etc.
    if (isProduction && status >= 500) {
      // Map common error types to safe generic messages
      const genericMessage = this.getGenericErrorMessage(status);
      message = genericMessage;
      error = 'Internal Server Error';
    }

    // Build standardized error response
    const errorResponse: ErrorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      error,
      requestId: request.headers['x-request-id'] as string | undefined,
    };

    // Log error details (always log original message and stack trace)
    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} - ${status} - ${originalMessage}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else if (status >= 400) {
      this.logger.warn(
        `${request.method} ${request.url} - ${status} - ${originalMessage}`,
      );
    }

    // Send standardized error response (never includes stack trace)
    response.status(status).json(errorResponse);
  }

  /**
   * Returns a generic error message for production based on status code
   * to prevent exposing internal implementation details
   */
  private getGenericErrorMessage(status: number): string {
    const errorMessages: Record<number, string> = {
      500: 'An unexpected error occurred. Please try again later.',
      501: 'This feature is not implemented.',
      502: 'The service is temporarily unavailable. Please try again later.',
      503: 'The service is temporarily unavailable. Please try again later.',
      504: 'The request timed out. Please try again later.',
    };

    return (
      errorMessages[status] ||
      'An unexpected error occurred. Please try again later.'
    );
  }
}
