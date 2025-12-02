import { PrismaClient, Prisma } from '@prisma/client';
import { Logger } from '@nestjs/common';

/**
 * Transaction retry configuration
 */
export interface TransactionRetryOptions {
  maxRetries?: number; // Maximum number of retry attempts (default: 3)
  timeout?: number; // Transaction timeout in milliseconds (default: 30000)
  retryDelay?: number; // Initial delay between retries in ms (default: 100)
  exponentialBackoff?: boolean; // Use exponential backoff (default: true)
}

/**
 * Error codes that are retryable
 * These are typically transient errors like deadlocks
 */
const RETRYABLE_ERROR_CODES = [
  'P2034', // Transaction failed due to write conflict or deadlock
  'P2024', // Timed out fetching a new connection from the pool
  'P2028', // Transaction API error
];

/**
 * Executes a Prisma transaction with automatic retry logic
 * Retries on transient errors like deadlocks with exponential backoff
 *
 * @param prisma - Prisma client instance
 * @param fn - Transaction callback function
 * @param options - Retry configuration options
 * @returns Result of the transaction
 *
 * @example
 * ```typescript
 * await executeTransactionWithRetry(
 *   this.prisma,
 *   async (tx) => {
 *     await tx.user.update({ where: { id }, data: { ... } });
 *     await tx.project.create({ data: { ... } });
 *   },
 *   { maxRetries: 3, timeout: 30000 }
 * );
 * ```
 */
export async function executeTransactionWithRetry<R>(
  prisma: PrismaClient,
  fn: (tx: Prisma.TransactionClient) => Promise<R>,
  options: TransactionRetryOptions = {},
): Promise<R> {
  const {
    maxRetries = 3,
    timeout = 30000,
    retryDelay = 100,
    exponentialBackoff = true,
  } = options;

  const logger = new Logger('TransactionRetry');
  let lastError: Error = new Error('Transaction failed with unknown error');

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await prisma.$transaction(fn, { timeout });
    } catch (error) {
      const err = error as Error;
      lastError = err;

      // Check if error is retryable
      const isRetryable = RETRYABLE_ERROR_CODES.some((code) =>
        err.message?.includes(code),
      );

      // If not retryable or last attempt, throw immediately
      if (!isRetryable || attempt === maxRetries) {
        logger.error(
          `Transaction failed ${isRetryable ? 'after max retries' : '(non-retryable error)'}:`,
          err.message,
        );
        throw err;
      }

      // Calculate delay with exponential backoff
      const delay = exponentialBackoff
        ? retryDelay * Math.pow(2, attempt)
        : retryDelay;

      logger.warn(
        `Transaction failed (attempt ${attempt + 1}/${maxRetries + 1}): ${err.message}. Retrying in ${delay}ms...`,
      );

      // Wait before retry
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Decorator to wrap transaction methods with retry logic
 * Use this on service methods that contain transactions
 *
 * @param options - Retry configuration options
 *
 * @example
 * ```typescript
 * @RetryTransaction({ maxRetries: 3 })
 * async deleteProject(id: string, userId: string) {
 *   await executeTransactionWithRetry(this.prisma, async (tx) => {
 *     // Transaction logic here
 *   });
 * }
 * ```
 */
export function RetryTransaction(options: TransactionRetryOptions = {}) {
  return function (
    _target: any,
    _propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      try {
        return await originalMethod.apply(this, args);
      } catch (error) {
        const err = error as Error;
        const logger = new Logger('RetryTransaction');
        logger.error(`Method ${_propertyKey} failed:`, err.message);
        throw err;
      }
    };

    return descriptor;
  };
}
