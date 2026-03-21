import { Logger } from '@nestjs/common';

/**
 * Environment variable validation
 * Ensures all required environment variables are present at application startup
 * This prevents runtime failures due to missing configuration
 */

interface RequiredEnvVars {
  // Database
  DATABASE_URL: string;

  // JWT
  JWT_SECRET: string;
  JWT_EXPIRATION: string;

  // Frontend
  FRONTEND_URL: string;

  // Storage (S3-compatible: DigitalOcean Spaces, AWS S3, etc.)
  STORAGE_ENDPOINT: string;
  STORAGE_PORT: string;
  STORAGE_ACCESS_KEY: string;
  STORAGE_SECRET_KEY: string;
  STORAGE_BUCKET: string;
  STORAGE_USE_SSL: string;

  // Email (Resend API)
  RESEND_API_KEY: string;
  EMAIL_FROM: string;

  // Application
  NODE_ENV: string;
  PORT: string;
}

const logger = new Logger('EnvValidator');

/**
 * Validates that all required environment variables are present
 * Throws an error if any required variable is missing
 */
export function validateEnvironmentVariables(): void {
  const requiredVars: (keyof RequiredEnvVars)[] = [
    'DATABASE_URL',
    'JWT_SECRET',
    'JWT_EXPIRATION',
    'FRONTEND_URL',
    'STORAGE_ENDPOINT',
    'STORAGE_PORT',
    'STORAGE_ACCESS_KEY',
    'STORAGE_SECRET_KEY',
    'STORAGE_BUCKET',
    'STORAGE_USE_SSL',
    'RESEND_API_KEY',
    'EMAIL_FROM',
    'NODE_ENV',
    'PORT',
  ];

  const missingVars: string[] = [];
  const emptyVars: string[] = [];

  for (const varName of requiredVars) {
    const value = process.env[varName];

    if (value === undefined) {
      missingVars.push(varName);
    } else if (value.trim() === '') {
      emptyVars.push(varName);
    }
  }

  if (missingVars.length > 0 || emptyVars.length > 0) {
    const errors: string[] = [];

    if (missingVars.length > 0) {
      errors.push(
        `Missing required environment variables:\n  - ${missingVars.join('\n  - ')}`,
      );
    }

    if (emptyVars.length > 0) {
      errors.push(
        `Empty environment variables (must have values):\n  - ${emptyVars.join('\n  - ')}`,
      );
    }

    logger.error('Environment validation failed!');
    logger.error(errors.join('\n\n'));
    logger.error(
      '\nPlease check your .env file and ensure all required variables are set.',
    );

    throw new Error(
      `Environment validation failed. Missing or empty variables detected. See logs above for details.`,
    );
  }

  // Validate specific formats
  validateJwtSecret();
  validatePort();
  validateNodeEnv();
  validateStoragePort();

  logger.log('✓ All environment variables validated successfully');
}

/**
 * Validates JWT secret is strong enough
 */
function validateJwtSecret(): void {
  const secret = process.env.JWT_SECRET!;

  if (secret.length < 32) {
    throw new Error(
      'JWT_SECRET must be at least 32 characters long for security',
    );
  }

  if (process.env.NODE_ENV === 'production' && secret.endsWith('-dev')) {
    throw new Error(
      'JWT_SECRET appears to be a development secret. Use a strong, random secret in production',
    );
  }
}

/**
 * Validates PORT is a valid number
 */
function validatePort(): void {
  const port = Number.parseInt(process.env.PORT ?? '', 10);

  if (Number.isNaN(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be a valid number between 1 and 65535');
  }
}

/**
 * Validates NODE_ENV is a valid environment
 */
function validateNodeEnv(): void {
  const validEnvs = ['development', 'production', 'test'];
  const env = process.env.NODE_ENV!;

  if (!validEnvs.includes(env)) {
    throw new Error(
      `NODE_ENV must be one of: ${validEnvs.join(', ')}. Got: ${env}`,
    );
  }
}

/**
 * Validates STORAGE_PORT is a valid number
 */
function validateStoragePort(): void {
  const port = Number.parseInt(process.env.STORAGE_PORT ?? '', 10);

  if (Number.isNaN(port) || port < 1 || port > 65535) {
    throw new Error('STORAGE_PORT must be a valid number between 1 and 65535');
  }
}
