import {
  PipeTransform,
  Injectable,
  BadRequestException,
  ArgumentMetadata,
} from '@nestjs/common';
import { z } from 'zod';

/**
 * Validation pipe that uses Zod schemas for request validation.
 *
 * @example
 * ```typescript
 * @Post()
 * async create(
 *   @Body(new ZodValidationPipe(CreateProjectSchema)) dto: CreateProjectDto,
 * ) {
 *   return this.projectService.create(dto);
 * }
 * ```
 */
@Injectable()
export class ZodValidationPipe<T> implements PipeTransform {
  private readonly schema: z.ZodSchema<T>;

  constructor(schema: z.ZodSchema<T>) {
    this.schema = schema;
  }

  transform(value: unknown, _metadata: ArgumentMetadata): T {
    const result = this.schema.safeParse(value);

    if (!result.success) {
      const formattedErrors = this.formatZodError(result.error);
      throw new BadRequestException({
        message: 'Validation failed',
        errors: formattedErrors,
      });
    }

    return result.data;
  }

  private formatZodError(error: z.ZodError): Record<string, string[]> {
    const errors: Record<string, string[]> = {};

    for (const issue of error.issues) {
      const path = issue.path.join('.') || '_root';
      if (!errors[path]) {
        errors[path] = [];
      }
      errors[path].push(issue.message);
    }

    return errors;
  }
}

/**
 * Factory function to create a ZodValidationPipe
 *
 * @example
 * ```typescript
 * @Post()
 * async create(
 *   @Body(zodPipe(CreateProjectSchema)) dto: CreateProjectDto,
 * ) {
 *   return this.projectService.create(dto);
 * }
 * ```
 */
export function zodPipe<T>(schema: z.ZodSchema<T>): ZodValidationPipe<T> {
  return new ZodValidationPipe(schema);
}
