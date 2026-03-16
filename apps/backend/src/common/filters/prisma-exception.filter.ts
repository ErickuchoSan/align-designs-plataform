import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { Prisma } from '@prisma/client';

/**
 * Prisma Exception Filter
 *
 * Intercepts Prisma errors and converts them to user-friendly HTTP responses.
 * Prevents database schema and technical details from being exposed to users.
 *
 * User-facing messages are generic and safe, while technical details are logged
 * for developers to debug issues.
 */
@Catch(
  Prisma.PrismaClientKnownRequestError,
  Prisma.PrismaClientUnknownRequestError,
  Prisma.PrismaClientRustPanicError,
  Prisma.PrismaClientInitializationError,
  Prisma.PrismaClientValidationError,
)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    // Determine error type and appropriate response
    const errorResponse = this.handlePrismaError(exception);

    // Log technical details for developers (only in server logs, not sent to client)
    this.logger.error('Prisma Error', {
      type: exception.constructor.name,
      code: exception.code,
      meta: exception.meta,
      message: exception.message,
      url: request.url,
      method: request.method,
    });

    // Send user-friendly response
    response.status(errorResponse.status).json({
      statusCode: errorResponse.status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: errorResponse.message,
      error: errorResponse.error,
    });
  }

  /**
   * Map Prisma errors to user-friendly messages
   * Returns generic messages that don't expose database schema
   */
  private handlePrismaError(exception: any): {
    status: HttpStatus;
    message: string;
    error: string;
  } {
    // Handle known Prisma errors with specific codes
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2000':
          return {
            status: HttpStatus.BAD_REQUEST,
            message: 'The provided value is too long for the field.',
            error: 'Bad Request',
          };

        case 'P2001':
          return {
            status: HttpStatus.NOT_FOUND,
            message: 'The requested record does not exist.',
            error: 'Not Found',
          };

        case 'P2002':
          // Unique constraint violation
          const target = exception.meta?.target as string[] | undefined;
          const field = target?.[0] || 'field';
          return {
            status: HttpStatus.CONFLICT,
            message: `A record with this ${field} already exists.`,
            error: 'Conflict',
          };

        case 'P2003':
          // Foreign key constraint violation
          return {
            status: HttpStatus.BAD_REQUEST,
            message: 'The operation references a record that does not exist.',
            error: 'Bad Request',
          };

        case 'P2004':
          return {
            status: HttpStatus.BAD_REQUEST,
            message: 'A database constraint was violated.',
            error: 'Bad Request',
          };

        case 'P2005':
          return {
            status: HttpStatus.BAD_REQUEST,
            message: 'The provided value is not valid for this field.',
            error: 'Bad Request',
          };

        case 'P2006':
          return {
            status: HttpStatus.BAD_REQUEST,
            message: 'The provided value is not valid.',
            error: 'Bad Request',
          };

        case 'P2007':
          return {
            status: HttpStatus.BAD_REQUEST,
            message: 'Data validation error.',
            error: 'Bad Request',
          };

        case 'P2011':
          return {
            status: HttpStatus.BAD_REQUEST,
            message: 'A required field is missing.',
            error: 'Bad Request',
          };

        case 'P2014':
          return {
            status: HttpStatus.BAD_REQUEST,
            message: 'The change would violate a required relation.',
            error: 'Bad Request',
          };

        case 'P2015':
          return {
            status: HttpStatus.NOT_FOUND,
            message: 'A related record could not be found.',
            error: 'Not Found',
          };

        case 'P2025':
          // Record not found for update/delete
          return {
            status: HttpStatus.NOT_FOUND,
            message: 'The record you are trying to modify does not exist.',
            error: 'Not Found',
          };

        default:
          return {
            status: HttpStatus.BAD_REQUEST,
            message: 'A database operation failed.',
            error: 'Bad Request',
          };
      }
    }

    // Handle validation errors
    if (exception instanceof Prisma.PrismaClientValidationError) {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: 'Invalid data provided. Please check your input.',
        error: 'Validation Error',
      };
    }

    // Handle unknown errors
    if (exception instanceof Prisma.PrismaClientUnknownRequestError) {
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message:
          'An unexpected database error occurred. Please try again later.',
        error: 'Internal Server Error',
      };
    }

    // Handle initialization errors (database connection issues)
    if (exception instanceof Prisma.PrismaClientInitializationError) {
      return {
        status: HttpStatus.SERVICE_UNAVAILABLE,
        message:
          'Database service is currently unavailable. Please try again later.',
        error: 'Service Unavailable',
      };
    }

    // Handle panic errors (critical issues)
    if (exception instanceof Prisma.PrismaClientRustPanicError) {
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'A critical database error occurred. Please contact support.',
        error: 'Internal Server Error',
      };
    }

    // Default fallback for unhandled Prisma errors
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'An unexpected error occurred. Please try again later.',
      error: 'Internal Server Error',
    };
  }
}
