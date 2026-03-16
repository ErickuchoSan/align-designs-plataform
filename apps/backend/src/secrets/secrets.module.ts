import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SecretsService } from './secrets.service';
import { EnvSecretsManager } from './managers/env-secrets-manager';
import { AwsSecretsManager } from './managers/aws-secrets-manager';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [SecretsService, EnvSecretsManager, AwsSecretsManager],
  exports: [SecretsService],
})
export class SecretsModule {}
