/**
 * Typed error handling utilities
 * Provides type-safe error handling with type guards instead of assertions
 */

import { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { logger } from './logger';

export interface ApiErrorResponse {
  message: string;
  error?: string;
  statusCode?: number;
}

/**
 * Check if dev mode is enabled (only for ADMIN users)
 */
function isDevModeEnabled(): boolean {
  return typeof window !== 'undefined' && localStorage.getItem('devMode') === 'true';
}

/**
 * Map HTTP status code to user-friendly message
 */
function getStatusMessage(status: number): string | null {
  const statusMessages: Record<number, string> = {
    400: 'Invalid request. Please check your input.',
    401: 'Unauthorized. Please log in again.',
    403: 'Access forbidden',
    404: 'Resource not found',
    409: 'This operation conflicts with existing data.',
    422: 'The data provided is invalid.',
    429: 'Too many requests. Please try again later.',
    500: 'Server error. Please try again later.',
  };
  if (statusMessages[status]) return statusMessages[status];
  if (status >= 500) return 'Server error. Please try again later.';
  return null;
}

/**
 * Build dev mode technical details for Axios errors
 */
function buildDevModeDetails(error: AxiosError<ApiErrorResponse>): string {
  const details: string[] = [];
  const config = error.config as InternalAxiosRequestConfig | undefined;
  const response = error.response;

  if (response?.data?.message) {
    details.push(`[${response.status}] ${response.data.message}`, '', '🔧 Technical Details:', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }

  details.push(
    `Method: ${config?.method?.toUpperCase() || 'UNKNOWN'}`,
    `URL: ${config?.url || 'unknown'}`,
    `Status: ${response?.status || 'N/A'} ${response?.statusText || ''}`,
    `Timestamp: ${new Date().toISOString()}`
  );

  if (config?.data) {
    try {
      const requestData = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
      details.push('', '📤 Request Body:', JSON.stringify(requestData, null, 2));
    } catch {
      details.push('', '📤 Request Body:', String(config.data));
    }
  }

  if (response?.data) {
    details.push('', '📥 Response Data:', JSON.stringify(response.data, null, 2));
  }

  if (error.stack) {
    details.push('', '📚 Stack Trace:', error.stack);
  }

  return details.join('\n');
}

/**
 * Handle Axios error with response data
 */
function handleAxiosResponseError(error: AxiosError<ApiErrorResponse>, isDevMode: boolean): string | null {
  const response = error.response;
  if (!response) return null;

  // Check for API error message in response
  if (response.data?.message) {
    return isDevMode ? buildDevModeDetails(error) : response.data.message;
  }

  // Check for generic error message
  if (response.data?.error) {
    return isDevMode ? `[${response.status}] ${response.data.error}` : response.data.error;
  }

  // HTTP status code messages
  if (response.status) {
    if (isDevMode) {
      return buildDevModeDetails(error);
    }
    return getStatusMessage(response.status);
  }

  return null;
}

/**
 * Handle Axios network errors (no response)
 */
function handleAxiosNetworkError(error: AxiosError<ApiErrorResponse>, isDevMode: boolean): string | null {
  const config = error.config;

  if (error.code === 'ERR_NETWORK') {
    if (isDevMode) {
      return `🔴 NETWORK ERROR\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nMessage: ${error.message}\nCode: ${error.code}\nURL: ${config?.url || 'unknown'}\nMethod: ${config?.method?.toUpperCase() || 'UNKNOWN'}\n\nStack:\n${error.stack || 'No stack trace'}`;
    }
    return 'Network error. Please check your internet connection.';
  }

  if (error.code === 'ECONNABORTED') {
    if (isDevMode) {
      return `⏱️ TIMEOUT ERROR\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nMessage: ${error.message}\nTimeout: ${config?.timeout || 'unknown'}ms\nURL: ${config?.url}\nMethod: ${config?.method?.toUpperCase()}\n\nStack:\n${error.stack || 'No stack trace'}`;
    }
    return 'Request timed out. Please try again.';
  }

  return null;
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
 * Format standard Error for dev mode
 */
function formatErrorForDevMode(error: Error): string {
  return `💥 ERROR: ${error.name}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nMessage: ${error.message}\n\nStack Trace:\n${error.stack || 'No stack trace available'}`;
}

/**
 * Format generic Axios error for dev mode
 */
function formatGenericAxiosError(error: AxiosError<ApiErrorResponse>): string {
  return `⚠️ AXIOS ERROR\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n${error.message}\n\nCode: ${error.code || 'none'}\nURL: ${error.config?.url || 'unknown'}\n\nStack:\n${error.stack || 'No stack trace'}`;
}

/**
 * Handle Axios errors
 */
function handleAxiosError(error: AxiosError<ApiErrorResponse>, isDevMode: boolean): string | null {
  // Try response error first
  const responseError = handleAxiosResponseError(error, isDevMode);
  if (responseError) return responseError;

  // Try network error
  const networkError = handleAxiosNetworkError(error, isDevMode);
  if (networkError) return networkError;

  // Generic Axios error
  if (error.message) {
    return isDevMode ? formatGenericAxiosError(error) : 'An error occurred. Please try again.';
  }

  return null;
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
  const isDevMode = isDevModeEnabled();

  // Handle Axios errors
  if (isAxiosError(error)) {
    const result = handleAxiosError(error, isDevMode);
    if (result) return result;
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    return isDevMode ? formatErrorForDevMode(error) : fallback;
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
  // In dev mode, don't show inline errors (popup handles it)
  if (isDevModeEnabled()) {
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
