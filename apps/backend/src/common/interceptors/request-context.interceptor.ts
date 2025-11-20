import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

/**
 * Interceptor to add request context to errors
 * This ensures that all errors include the request ID for tracing
 */
@Injectable()
export class RequestContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const requestId = request.requestId;

    return next.handle().pipe(
      tap(() => {
        // Can add success logging here if needed
      }),
      catchError((error) => {
        // Attach request ID to error for logging
        if (requestId && error) {
          error.requestId = requestId;
        }
        return throwError(() => error);
      }),
    );
  }
}
