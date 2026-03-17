import { applyDecorators } from '@nestjs/common';
import { ApiResponse, ApiParam } from '@nestjs/swagger';

/**
 * Common API response decorators to reduce duplication
 */

// Common error responses
export const ApiUnauthorizedResponse = () =>
  ApiResponse({ status: 401, description: 'Unauthorized' });

export const ApiForbiddenAdminResponse = () =>
  ApiResponse({ status: 403, description: 'Forbidden - Admin only' });

export const ApiNotFoundResponse = (resource = 'Resource') =>
  ApiResponse({ status: 404, description: `${resource} not found` });

export const ApiBadRequestResponse = (message = 'Invalid input data') =>
  ApiResponse({ status: 400, description: message });

export const ApiTooManyRequestsResponse = () =>
  ApiResponse({ status: 429, description: 'Too many requests' });

// Combined response decorators for common patterns
export function ApiCrudResponses(resource: string) {
  return applyDecorators(
    ApiBadRequestResponse(),
    ApiUnauthorizedResponse(),
    ApiForbiddenAdminResponse(),
    ApiNotFoundResponse(resource),
    ApiTooManyRequestsResponse(),
  );
}

export function ApiAdminWriteResponses() {
  return applyDecorators(
    ApiBadRequestResponse(),
    ApiUnauthorizedResponse(),
    ApiForbiddenAdminResponse(),
    ApiTooManyRequestsResponse(),
  );
}

export function ApiReadResponses(resource: string) {
  return applyDecorators(
    ApiUnauthorizedResponse(),
    ApiNotFoundResponse(resource),
  );
}

// Project-specific param decorator
export const ApiProjectIdParam = () =>
  ApiParam({ name: 'id', description: 'Project ID' });
