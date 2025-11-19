/**
 * Typed error handling utilities
 * Provides type-safe error handling with type guards instead of assertions
 */

import { AxiosError } from 'axios';
import { logger } from './logger';

export interface ApiErrorResponse {
  message: string;
  error?: string;
  statusCode?: number;
}

/**
 * Type guard to check if error is an Axios error
 */
export function isAxiosError(error: unknown): error is AxiosError<ApiErrorResponse> {
  return (
    typeof error === 'object' &&
    error !== null &&
    'isAxiosError' in error &&
    (error as AxiosError).isAxiosError === true
  );
}

/**
 * Type guard to check if error has a message property
 */
export function hasMessage(error: unknown): error is { message: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string'
  );
}

/**
 * Type guard to check if error has a response property
 */
export function hasResponse(
  error: unknown,
): error is { response: { data: ApiErrorResponse } } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof (error as { response: unknown }).response === 'object' &&
    (error as { response: unknown }).response !== null
  );
}

/**
 * Extract user-friendly error message from any error type
 * @param error - The error object
 * @param fallback - Fallback message if no message can be extracted
 * @returns User-friendly error message
 */
export function getErrorMessage(
  error: unknown,
  fallback: string = 'An unexpected error occurred',
): string {
  // Handle Axios errors with response
  if (isAxiosError(error)) {
    // Check for API error message in response
    if (error.response?.data?.message) {
      return error.response.data.message;
    }

    // Check for generic error message in response
    if (error.response?.data?.error) {
      return error.response.data.error;
    }

    // Network errors (no response)
    if (error.code === 'ERR_NETWORK') {
      return 'Network error. Please check your internet connection.';
    }

    // Timeout errors
    if (error.code === 'ECONNABORTED') {
      return 'Request timed out. Please try again.';
    }

    // HTTP status code messages
    if (error.response?.status) {
      const status = error.response.status;
      if (status === 404) return 'Resource not found';
      if (status === 403) return 'Access forbidden';
      if (status === 401) return 'Unauthorized. Please log in again.';
      if (status === 500) return 'Server error. Please try again later.';
      if (status >= 500) return 'Server error. Please try again later.';
    }

    // Generic Axios error
    if (error.message) {
      return error.message;
    }
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    return error.message;
  }

  // Handle objects with message property
  if (hasMessage(error)) {
    return error.message;
  }

  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }

  // Fallback
  return fallback;
}

/**
 * Get HTTP status code from error if available
 */
export function getErrorStatus(error: unknown): number | undefined {
  if (isAxiosError(error)) {
    return error.response?.status;
  }
  return undefined;
}

/**
 * Check if error is a specific HTTP status code
 */
export function isErrorStatus(error: unknown, status: number): boolean {
  return getErrorStatus(error) === status;
}

/**
 * Check if error is a validation error (400)
 */
export function isValidationError(error: unknown): boolean {
  return isErrorStatus(error, 400);
}

/**
 * Check if error is an unauthorized error (401)
 */
export function isUnauthorizedError(error: unknown): boolean {
  return isErrorStatus(error, 401);
}

/**
 * Check if error is a forbidden error (403)
 */
export function isForbiddenError(error: unknown): boolean {
  return isErrorStatus(error, 403);
}

/**
 * Check if error is a not found error (404)
 */
export function isNotFoundError(error: unknown): boolean {
  return isErrorStatus(error, 404);
}

/**
 * Check if error is a server error (5xx)
 */
export function isServerError(error: unknown): boolean {
  const status = getErrorStatus(error);
  return status !== undefined && status >= 500 && status < 600;
}

/**
 * Log error with context for debugging
 * Uses logger utility to only log in development
 */
export function logError(error: unknown, context?: string): void {
  const prefix = context ? `[${context}]` : '';

  if (isAxiosError(error)) {
    logger.error(`${prefix} API Error:`, {
      message: getErrorMessage(error),
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method,
    });
  } else if (error instanceof Error) {
    logger.error(`${prefix} Error: ${error.message}`, error.stack);
  } else {
    logger.error(`${prefix} Unknown Error:`, error);
  }
}
