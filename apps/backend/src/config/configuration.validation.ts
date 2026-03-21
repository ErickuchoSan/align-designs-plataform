import { plainToClass } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  Matches,
  MinLength,
  validateSync,
} from 'class-validator';

class EnvironmentVariables {
  @IsString()
  @IsNotEmpty()
  @MinLength(64, {
    message:
      'JWT_SECRET must be at least 64 characters long for production security',
  })
  JWT_SECRET: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^postgresql:\/\//, {
    message: 'DATABASE_URL must be a valid PostgreSQL connection string',
  })
  DATABASE_URL: string;

  @IsString()
  @IsNotEmpty()
  STORAGE_ENDPOINT: string;

  @IsString()
  @IsNotEmpty()
  STORAGE_ACCESS_KEY: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8, {
    message: 'STORAGE_SECRET_KEY must be at least 8 characters long',
  })
  STORAGE_SECRET_KEY: string;

  @IsString()
  @IsNotEmpty()
  STORAGE_BUCKET: string;

  @IsString()
  @IsNotEmpty()
  RESEND_API_KEY: string;

  @IsString()
  @IsNotEmpty()
  EMAIL_FROM: string;

  @IsString()
  @IsNotEmpty()
  CORS_ORIGIN: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToClass(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const missingVars = errors.map((err) => err.property).join(', ');
    throw new Error(
      `Missing or invalid required environment variables: ${missingVars}`,
    );
  }

  return validatedConfig;
}