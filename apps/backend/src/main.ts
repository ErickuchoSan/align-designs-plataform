import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import compression from 'compression';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import express from 'express';
import { AppModule } from './app.module';
import { ThrottlerExceptionFilter } from './common/filters/throttler-exception.filter';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';
import { validateEnvironmentVariables } from './common/config/env-validator';

// Handle BigInt serialization
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

async function bootstrap() {
  // Validate environment variables before starting the application
  validateEnvironmentVariables();

  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const logger = new Logger('Bootstrap');

  // Enable API versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
    prefix: 'api/v',
  });

  // Enable cookie parser (required for CSRF)
  app.use(cookieParser());

  // Serve static files from uploads directory
  app.useStaticAssets('uploads', {
    prefix: '/uploads/',
  });

  // Add request body size limits to prevent DoS attacks
  // Note: File uploads use multipart/form-data which bypasses these limits
  // These limits only apply to JSON and URL-encoded payloads
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // Enable compression
  app.use(compression());

  // Enable Helmet security headers
  const isProduction = process.env.NODE_ENV === 'production';

  // Get MinIO endpoint for CSP configuration
  const minioEndpoint = process.env.MINIO_ENDPOINT ?? 'localhost';
  const minioPort = process.env.MINIO_PORT ?? '9000';
  const minioUseSSL = process.env.MINIO_USE_SSL === 'true';
  const minioProtocol = minioUseSSL ? 'https' : 'http';
  const minioUrl = `${minioProtocol}://${minioEndpoint}:${minioPort}`;

  app.use(
    helmet({
      // Content Security Policy - Prevents XSS attacks
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:', 'http:', minioUrl],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'", minioUrl],
          frameSrc: ["'self'", minioUrl], // Allow MinIO iframes for PDF preview
        },
      },
      // HSTS - Force HTTPS in production
      strictTransportSecurity: isProduction
        ? {
          maxAge: 31536000, // 1 year in seconds
          includeSubDomains: true,
          preload: true,
        }
        : false, // Disable in development (http://localhost)
      // Referrer Policy - Control referrer information leakage
      referrerPolicy: {
        policy: 'strict-origin-when-cross-origin',
      },
      // X-Content-Type-Options - Prevent MIME sniffing
      noSniff: true,
      // X-Frame-Options - Prevent clickjacking (already default in helmet)
      frameguard: {
        action: 'deny',
      },
      // X-DNS-Prefetch-Control - Control DNS prefetching
      dnsPrefetchControl: {
        allow: false,
      },
      // X-Download-Options - Prevent IE from executing downloads
      ieNoOpen: true,
      // X-Permitted-Cross-Domain-Policies - Restrict Adobe Flash and PDF
      permittedCrossDomainPolicies: {
        permittedPolicies: 'none',
      },
      crossOriginEmbedderPolicy: false, // Allow file downloads
      crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow CORS requests
      crossOriginOpenerPolicy: false, // Suppress COOP warnings in dev (HTTP)
    }),
  );

  // Enable CORS with support for multiple origins
  const allowedOriginsStr =
    process.env.ALLOWED_ORIGINS ?? 'http://localhost:3000';
  const allowedOrigins = allowedOriginsStr
    .split(',')
    .map((origin) => origin.trim());

  logger.log(`CORS enabled for origins: ${allowedOrigins.join(', ')}`);

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      const isProduction = process.env.NODE_ENV === 'production';

      // Allow requests with no origin (like mobile apps or curl requests)
      // Only in development. In production, require origin header.
      if (!origin) {
        if (isProduction) {
          logger.warn('CORS blocked: Missing origin header in production');
          callback(new Error('Origin header required'));
          return;
        }
        callback(null, true);
        return;
      }

      // Allow ngrok domains (*.ngrok-free.app or *.ngrok.io)
      const isNgrokDomain = origin.includes('.ngrok-free.app') || origin.includes('.ngrok.io') || origin.includes('.ngrok-free.dev');

      if (allowedOrigins.includes(origin) || isNgrokDomain) {
        callback(null, true);
      } else {
        logger.warn(`CORS blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
    exposedHeaders: ['X-CSRF-Token'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global exception filters
  // Order matters: More specific filters first, then general ones
  app.useGlobalFilters(
    new PrismaExceptionFilter(), // Handle Prisma errors first
    new HttpExceptionFilter(),   // Then HTTP exceptions
    new ThrottlerExceptionFilter(), // Then throttling errors
  );

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Align Designs API')
    .setDescription(
      'API documentation for Align Designs - A comprehensive project management system with file uploads, user authentication, and role-based access control',
    )
    .setVersion('1.0')
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management endpoints')
    .addTag('projects', 'Project management endpoints')
    .addTag('files', 'File upload and management endpoints')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Align Designs API Documentation',
    customCss: '.swagger-ui .topbar { display: none }',
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
    },
  });

  const port = process.env.PORT ?? 4000;
  await app.listen(port);
  logger.log(`Application is running on: http://localhost:${port}`);
  logger.log(`API v1 available at: http://localhost:${port}/api/v1`);
  logger.log(
    `API Documentation available at: http://localhost:${port}/api/docs`,
  );
}

bootstrap().catch((error) => {
  const logger = new Logger('Bootstrap');
  logger.error('Failed to start application:', error);
  process.exit(1);
});
