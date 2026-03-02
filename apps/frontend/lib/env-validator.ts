/**
 * Environment variable validation utility
 * Validates that all required environment variables are defined
 */

interface EnvConfig {
  [key: string]: {
    required: boolean;
    description: string;
    defaultValue?: string;
  };
}

/**
 * Required and optional environment variables configuration
 */
const ENV_CONFIG: EnvConfig = {
  NEXT_PUBLIC_API_URL: {
    required: true,
    description: 'Backend API URL',
    // Use relative URL by default - works with reverse proxy setups
    // The browser will resolve /api/v1 to the current domain
    defaultValue: '/api/v1',
  },
};

/**
 * Validates environment variables and provides helpful error messages
 */
export function validateEnv(): void {
  const errors: string[] = [];
  const warnings: string[] = [];

  Object.entries(ENV_CONFIG).forEach(([key, config]) => {
    const value = process.env[key];

    if (!value) {
      if (config.required && !config.defaultValue) {
        errors.push(
          `❌ Missing required environment variable: ${key}\n   Description: ${config.description}\n   Please add it to your .env.local file`,
        );
      } else if (config.required && config.defaultValue) {
        warnings.push(
          `⚠️  Environment variable ${key} not set, using default: ${config.defaultValue}\n   Description: ${config.description}`,
        );
      }
    }
  });

  // Log warnings only in development
  if (warnings.length > 0 && process.env.NODE_ENV === 'development') {
    console.warn('\n⚠️  Environment Variable Warnings:\n');
    warnings.forEach((warning) => console.warn(warning));
    console.warn('');
  }

  // Throw errors if any required variables are missing
  if (errors.length > 0) {
    const errorMessage = [
      '\n🚨 Environment Variable Validation Failed!\n',
      ...errors,
      '\n📝 Create a .env.local file in the frontend directory with the required variables.',
      '💡 You can copy .env.example and fill in the values.\n',
    ].join('\n');

    throw new Error(errorMessage);
  }
}

/**
 * Get a validated environment variable
 */
export function getEnv(key: keyof typeof ENV_CONFIG): string {
  const value = process.env[key];
  const config = ENV_CONFIG[key];

  if (!value && config.defaultValue) {
    return config.defaultValue;
  }

  if (!value) {
    throw new Error(
      `Environment variable ${key} is not defined. ${config.description}`,
    );
  }

  return value;
}

/**
 * Environment variables (validated and typed)
 * Uses getEnv to ensure proper validation and no unsafe fallbacks in production
 */
export const env = {
  API_URL: getEnv('NEXT_PUBLIC_API_URL'),
} as const;

// Run validation on module load (only in browser or during build)
if (typeof window !== 'undefined' || process.env.NODE_ENV !== 'test') {
  validateEnv();
}
