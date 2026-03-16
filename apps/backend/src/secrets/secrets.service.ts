import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ISecretsManager } from './interfaces/secrets-manager.interface';
import { EnvSecretsManager } from './managers/env-secrets-manager';
import { AwsSecretsManager } from './managers/aws-secrets-manager';

@Injectable()
export class SecretsService implements ISecretsManager, OnModuleInit {
  private readonly logger = new Logger(SecretsService.name);
  private connectionManager: ISecretsManager;

  constructor(
    private readonly configService: ConfigService,
    private readonly envSecretsManager: EnvSecretsManager,
    private readonly awsSecretsManager: AwsSecretsManager,
  ) {
    // Default to EnvSecretsManager
    this.connectionManager = this.envSecretsManager;
  }

  onModuleInit() {
    const useAwsSecrets =
      this.configService.get<string>('USE_AWS_SECRETS') === 'true';

    if (useAwsSecrets) {
      this.logger.log('Using AWS Secrets Manager for secrets retrieval');
      this.connectionManager = this.awsSecretsManager;
    } else {
      this.logger.log(
        'Using Environment Variables (.env) for secrets retrieval',
      );
      this.connectionManager = this.envSecretsManager;
    }
  }

  async getSecret(key: string): Promise<string | undefined> {
    return this.connectionManager.getSecret(key);
  }

  async getSecretOrThrow(key: string): Promise<string> {
    return this.connectionManager.getSecretOrThrow(key);
  }
}
