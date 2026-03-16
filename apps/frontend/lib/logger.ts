/**
 * Centralized logging utility for the frontend application.
 *
 * This logger provides environment-aware logging that:
 * - Logs detailed information in development
 * - Suppresses debug/info logs in production
 * - Provides structured logging for better debugging
 * - Can be integrated with external error tracking services
 *
 * Usage:
 *   import { logger } from '@/lib/logger';
 *   logger.debug('Detailed debug info', { userId: 123 });
 *   logger.info('User logged in', { email: user.email });
 *   logger.warn('API rate limit approaching');
 *   logger.error('Failed to fetch data', error);
 *   logger.apiError('/api/users', 500, error);
 */

const isDevelopment = process.env.NODE_ENV === 'development';

type LogContext = Record<string, any>;

class Logger {
  private formatMessage(level: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  /**
   * Log debug information (development only)
   * Use for detailed debugging information that helps during development
   */
  debug(message: string, context?: LogContext): void {
    if (isDevelopment) {
      console.debug(this.formatMessage('debug', message, context));
    }
  }

  /**
   * Log informational messages (development only)
   * Use for general information about application flow
   */
  info(message: string, context?: LogContext): void {
    if (isDevelopment) {
      console.log(this.formatMessage('info', message, context));
    }
  }

  /**
   * Log warning messages (all environments)
   * Use for potentially problematic situations
   */
  warn(message: string, context?: LogContext): void {
    console.warn(this.formatMessage('warn', message, context));
  }

  /**
   * Log error messages (all environments)
   * Use for error conditions that need attention
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    let errorDetails: Record<string, unknown> = {};
    if (error instanceof Error) {
      errorDetails = { name: error.name, message: error.message, stack: isDevelopment ? error.stack : undefined };
    } else if (error) {
      errorDetails = { error: String(error) };
    }

    const fullContext = { ...context, ...errorDetails };
    console.error(this.formatMessage('error', message, fullContext));

    // TODO: Send to error tracking service (Sentry) in production
    // if (!isDevelopment) {
    //   sendToErrorTracking(message, error, context);
    // }
  }

  /**
   * Log API errors with structured information
   * Useful for tracking API failures with endpoint and status code
   */
  apiError(endpoint: string, status: number, error: unknown, context?: LogContext): void {
    const apiContext = {
      endpoint,
      status,
      ...context
    };
    this.error(`API Error: ${endpoint} (${status})`, error as Error, apiContext);
  }

  /**
   * Log user actions for debugging (development only)
   * Helps track user flow during development
   */
  userAction(action: string, context?: LogContext): void {
    this.debug(`User Action: ${action}`, context);
  }
}

export const logger = new Logger();
