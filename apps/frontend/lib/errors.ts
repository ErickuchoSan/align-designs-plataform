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
 * @returns User-friendly or technical error message based on dev mode
 */
export function getErrorMessage(
  error: unknown,
  fallback: string = 'An unexpected error occurred',
): string {
  // Check if dev mode is enabled (only for ADMIN users)
  const isDevMode = typeof window !== 'undefined' && localStorage.getItem('devMode') === 'true';

  // Handle Axios errors with response
  if (isAxiosError(error)) {
    // Check for API error message in response
    if (error.response?.data?.message) {
      const backendMessage = error.response.data.message;

      // If dev mode, show comprehensive technical details
      if (isDevMode) {
        const details: string[] = [
          `[${error.response.status}] ${backendMessage}`,
          ``,
          `🔧 Technical Details:`,
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
          `Method: ${error.config?.method?.toUpperCase() || 'UNKNOWN'}`,
          `URL: ${error.config?.url || 'unknown'}`,
          `Status: ${error.response.status} ${error.response.statusText || ''}`,
          `Timestamp: ${new Date().toISOString()}`,
        ];

        // Add request data if present
        if (error.config?.data) {
          try {
            const requestData = typeof error.config.data === 'string'
              ? JSON.parse(error.config.data)
              : error.config.data;
            details.push(``, `📤 Request Body:`, JSON.stringify(requestData, null, 2));
          } catch {
            details.push(``, `📤 Request Body:`, String(error.config.data));
          }
        }

        // Add response data if present
        if (error.response.data) {
          details.push(``, `📥 Response Data:`, JSON.stringify(error.response.data, null, 2));
        }

        // Add stack trace if available
        if (error.stack) {
          details.push(``, `📚 Stack Trace:`, error.stack);
        }

        return details.join('\n');
      }

      // Otherwise, show the backend message (it's already user-friendly)
      return backendMessage;
    }

    // Check for generic error message in response
    if (error.response?.data?.error) {
      if (isDevMode) {
        return `[${error.response.status}] ${error.response.data.error}`;
      }
      return error.response.data.error;
    }

    // Network errors (no response)
    if (error.code === 'ERR_NETWORK') {
      if (isDevMode) {
        return `🔴 NETWORK ERROR\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nMessage: ${error.message}\nCode: ${error.code}\nURL: ${error.config?.url || 'unknown'}\nMethod: ${error.config?.method?.toUpperCase() || 'UNKNOWN'}\n\nStack:\n${error.stack || 'No stack trace'}`;
      }
      return 'Network error. Please check your internet connection.';
    }

    // Timeout errors
    if (error.code === 'ECONNABORTED') {
      if (isDevMode) {
        return `⏱️ TIMEOUT ERROR\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nMessage: ${error.message}\nTimeout: ${error.config?.timeout || 'unknown'}ms\nURL: ${error.config?.url}\nMethod: ${error.config?.method?.toUpperCase()}\n\nStack:\n${error.stack || 'No stack trace'}`;
      }
      return 'Request timed out. Please try again.';
    }

    // HTTP status code messages
    if (error.response?.status) {
      const status = error.response.status;

      if (isDevMode) {
        // Dev mode: Show comprehensive technical details
        const url = error.config?.url || 'unknown';
        const method = error.config?.method?.toUpperCase() || 'UNKNOWN';
        const fullUrl = error.config?.baseURL ? `${error.config.baseURL}${url}` : url;

        const techDetails = [
          `🚨 HTTP ERROR ${status}`,
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
          `${method} ${fullUrl}`,
          `Status: ${status} ${error.response.statusText || ''}`,
          `Message: ${error.message || 'No message'}`,
          ``,
          `📊 Additional Info:`,
          `Timestamp: ${new Date().toISOString()}`,
          `Base URL: ${error.config?.baseURL || 'not set'}`,
          `Path: ${url}`,
        ];

        // Add params if present
        if (error.config?.params) {
          techDetails.push(`Params: ${JSON.stringify(error.config.params)}`);
        }

        // Add response data
        if (error.response.data) {
          techDetails.push(``, `Response:`, JSON.stringify(error.response.data, null, 2));
        }

        // Add stack
        if (error.stack) {
          techDetails.push(``, `Stack:`, error.stack);
        }

        return techDetails.join('\n');
      }

      // User-friendly messages
      if (status === 404) return 'Resource not found';
      if (status === 403) return 'Access forbidden';
      if (status === 401) return 'Unauthorized. Please log in again.';
      if (status === 409) return 'This operation conflicts with existing data.';
      if (status === 400) return 'Invalid request. Please check your input.';
      if (status === 422) return 'The data provided is invalid.';
      if (status === 429) return 'Too many requests. Please try again later.';
      if (status === 500) return 'Server error. Please try again later.';
      if (status >= 500) return 'Server error. Please try again later.';
    }

    // Generic Axios error
    if (error.message) {
      if (isDevMode) {
        return `⚠️ AXIOS ERROR\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n${error.message}\n\nCode: ${error.code || 'none'}\nURL: ${error.config?.url || 'unknown'}\n\nStack:\n${error.stack || 'No stack trace'}`;
      }
      return 'An error occurred. Please try again.';
    }
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    if (isDevMode) {
      return `💥 ERROR: ${error.name}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nMessage: ${error.message}\n\nStack Trace:\n${error.stack || 'No stack trace available'}`;
    }
    return fallback;
  }

  // Handle objects with message property
  if (hasMessage(error)) {
    if (isDevMode) {
      return `📝 Message Error:\n${error.message}\n\nFull Object:\n${JSON.stringify(error, null, 2)}`;
    }
    return fallback;
  }

  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }

  // Fallback
  if (isDevMode) {
    return `❓ UNKNOWN ERROR TYPE\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nType: ${typeof error}\n\nSerialized:\n${JSON.stringify(error, null, 2)}`;
  }
  return fallback;
}

/**
 * Handle API errors with dev mode awareness
 * In dev mode: Returns empty string (popup will show error)
 * In normal mode: Returns user-friendly error message
 * @param error - The error object
 * @param fallback - Fallback message for normal mode
 * @returns Error message for inline display (empty in dev mode)
 */
export function handleApiError(
  error: unknown,
  fallback: string = 'An unexpected error occurred',
): string {
  // Check if dev mode is enabled
  const isDevMode = typeof window !== 'undefined' && localStorage.getItem('devMode') === 'true';

  // In dev mode, don't show inline errors (popup handles it)
  if (isDevMode) {
    return '';
  }

  // In normal mode, show user-friendly inline error
  return getErrorMessage(error, fallback);
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
