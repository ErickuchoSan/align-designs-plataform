import { applyDecorators } from '@nestjs/common';
import { ApiResponse, ApiParam } from '@nestjs/swagger';

/**
 * Common API response decorators to reduce duplication
 */

// Common success responses
export const ApiSuccessResponse = (description: string) =>
  ApiResponse({ status: 200, description });

export const ApiCreatedResponse = (description: string) =>
  ApiResponse({ status: 201, description });

// Common error responses
export const ApiUnauthorizedResponse = () =>
  ApiResponse({ status: 401, description: 'Unauthorized' });

export const ApiForbiddenAdminResponse = () =>
  ApiResponse({ status: 403, description: 'Forbidden - Admin only' });

export const ApiForbiddenResponse = (message = 'Forbidden') =>
  ApiResponse({ status: 403, description: message });

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

// Project workflow decorator (activate, complete, archive patterns)
export function ApiProjectWorkflowResponses(
  successMessage: string,
  errorMessage: string,
) {
  return applyDecorators(
    ApiSuccessResponse(successMessage),
    ApiBadRequestResponse(errorMessage),
  );
}
