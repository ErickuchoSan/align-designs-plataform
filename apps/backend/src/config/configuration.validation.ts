import { z } from 'zod';

/**
 * Environment variables schema using Zod
 * Validates all required configuration at startup
 */
const environmentSchema = z.object({
  JWT_SECRET: z
    .string()
    .min(
      64,
      'JWT_SECRET must be at least 64 characters long for production security',
    ),

  DATABASE_URL: z
    .string()
    .regex(
      /^postgresql:\/\//,
      'DATABASE_URL must be a valid PostgreSQL connection string',
    ),

  STORAGE_ENDPOINT: z.string().min(1, 'STORAGE_ENDPOINT is required'),
  STORAGE_ACCESS_KEY: z.string().min(1, 'STORAGE_ACCESS_KEY is required'),
  STORAGE_SECRET_KEY: z
    .string()
    .min(8, 'STORAGE_SECRET_KEY must be at least 8 characters long'),
  STORAGE_BUCKET: z.string().min(1, 'STORAGE_BUCKET is required'),

  RESEND_API_KEY: z.string().min(1, 'RESEND_API_KEY is required'),
  EMAIL_FROM: z.string().min(1, 'EMAIL_FROM is required'),

  CORS_ORIGIN: z.string().min(1, 'CORS_ORIGIN is required'),
});

export type EnvironmentVariables = z.infer<typeof environmentSchema>;

export function validate(config: Record<string, unknown>): EnvironmentVariables {
  const result = environmentSchema.safeParse(config);

  if (!result.success) {
    const missingVars = result.error.issues.map((issue) => issue.path.join('.')).join(', ');
    throw new Error(
      `Missing or invalid required environment variables: ${missingVars}`,
    );
  }

  return result.data;
}