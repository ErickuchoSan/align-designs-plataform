import { Global, Module } from '@nestjs/common';
import { RequestContextService } from './services/request-context.service';

/**
 * CommonModule
 *
 * Global module providing shared services across the application.
 * Services exported here are available without explicit import.
 */
@Global()
@Module({
  providers: [RequestContextService],
  exports: [RequestContextService],
})
export class CommonModule {}
