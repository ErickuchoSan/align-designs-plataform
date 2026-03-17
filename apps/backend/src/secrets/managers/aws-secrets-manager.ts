import { Injectable, Logger } from '@nestjs/common';
import { ISecretsManager } from '../interfaces/secrets-manager.interface';

@Injectable()
export class AwsSecretsManager implements ISecretsManager {
  private readonly logger = new Logger(AwsSecretsManager.name);

  async getSecret(key: string): Promise<string | undefined> {
    // AWS Secrets Manager integration not implemented - using EnvSecretsManager instead
    // To enable: set USE_AWS_SECRETS=true and implement aws-sdk integration
    this.logger.warn(
      `AWS Secrets Manager not configured. Returning undefined for ${key}`,
    );
    return undefined;
  }

  async getSecretOrThrow(key: string): Promise<string> {
    const value = await this.getSecret(key);
    if (!value) {
      throw new Error(`Secret key not found in AWS Secrets Manager: ${key}`);
    }
    return value;
  }
}
