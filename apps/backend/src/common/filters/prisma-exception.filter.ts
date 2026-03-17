import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { Prisma } from '@prisma/client';

interface PrismaErrorResponse {
  status: HttpStatus;
  message: string;
  error: string;
}

/**
 * Map of Prisma error codes to user-friendly responses
 * Centralizes error handling to reduce code duplication
 */
const PRISMA_ERROR_MAP: Record<string, PrismaErrorResponse> = {
  P2000: {
    status: HttpStatus.BAD_REQUEST,
    message: 'The provided value is too long for the field.',
    error: 'Bad Request',
  },
  P2001: {
    status: HttpStatus.NOT_FOUND,
    message: 'The requested record does not exist.',
    error: 'Not Found',
  },
  P2003: {
    status: HttpStatus.BAD_REQUEST,
    message: 'The operation references a record that does not exist.',
    error: 'Bad Request',
  },
  P2004: {
    status: HttpStatus.BAD_REQUEST,
    message: 'A database constraint was violated.',
    error: 'Bad Request',
  },
  P2005: {
    status: HttpStatus.BAD_REQUEST,
    message: 'The provided value is not valid for this field.',
    error: 'Bad Request',
  },
  P2006: {
    status: HttpStatus.BAD_REQUEST,
    message: 'The provided value is not valid.',
    error: 'Bad Request',
  },
  P2007: {
    status: HttpStatus.BAD_REQUEST,
    message: 'Data validation error.',
    error: 'Bad Request',
  },
  P2011: {
    status: HttpStatus.BAD_REQUEST,
    message: 'A required field is missing.',
    error: 'Bad Request',
  },
  P2014: {
    status: HttpStatus.BAD_REQUEST,
    message: 'The change would violate a required relation.',
    error: 'Bad Request',
  },
  P2015: {
    status: HttpStatus.NOT_FOUND,
    message: 'A related record could not be found.',
    error: 'Not Found',
  },
  P2025: {
    status: HttpStatus.NOT_FOUND,
    message: 'The record you are trying to modify does not exist.',
    error: 'Not Found',
  },
};

const DEFAULT_BAD_REQUEST: PrismaErrorResponse = {
  status: HttpStatus.BAD_REQUEST,
  message: 'A database operation failed.',
  error: 'Bad Request',
};

const ERROR_RESPONSES = {
  validation: {
    status: HttpStatus.BAD_REQUEST,
    message: 'Invalid data provided. Please check your input.',
    error: 'Validation Error',
  },
  unknown: {
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    message: 'An unexpected database error occurred. Please try again later.',
    error: 'Internal Server Error',
  },
  initialization: {
    status: HttpStatus.SERVICE_UNAVAILABLE,
    message:
      'Database service is currently unavailable. Please try again later.',
    error: 'Service Unavailable',
  },
  panic: {
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    message: 'A critical database error occurred. Please contact support.',
    error: 'Internal Server Error',
  },
  default: {
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    message: 'An unexpected error occurred. Please try again later.',
    error: 'Internal Server Error',
  },
} as const;

/**
 * Prisma Exception Filter
 *
 * Intercepts Prisma errors and converts them to user-friendly HTTP responses.
 * Prevents database schema and technical details from being exposed to users.
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

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    const errorResponse = this.handlePrismaError(exception);

    this.logger.error('Prisma Error', {
      type: (exception as Error).constructor.name,
      code: (exception as { code?: string }).code,
      meta: (exception as { meta?: unknown }).meta,
      message: (exception as Error).message,
      url: request.url,
      method: request.method,
    });

    response.status(errorResponse.status).json({
      statusCode: errorResponse.status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: errorResponse.message,
      error: errorResponse.error,
    });
  }

  private handlePrismaError(exception: unknown): PrismaErrorResponse {
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      // Special case: P2002 needs dynamic field extraction
      if (exception.code === 'P2002') {
        const target = exception.meta?.target as string[] | undefined;
        const field = target?.[0] || 'field';
        return {
          status: HttpStatus.CONFLICT,
          message: `A record with this ${field} already exists.`,
          error: 'Conflict',
        };
      }
      return PRISMA_ERROR_MAP[exception.code] ?? DEFAULT_BAD_REQUEST;
    }

    if (exception instanceof Prisma.PrismaClientValidationError) {
      return ERROR_RESPONSES.validation;
    }

    if (exception instanceof Prisma.PrismaClientUnknownRequestError) {
      return ERROR_RESPONSES.unknown;
    }

    if (exception instanceof Prisma.PrismaClientInitializationError) {
      return ERROR_RESPONSES.initialization;
    }

    if (exception instanceof Prisma.PrismaClientRustPanicError) {
      return ERROR_RESPONSES.panic;
    }

    return ERROR_RESPONSES.default;
  }
}
