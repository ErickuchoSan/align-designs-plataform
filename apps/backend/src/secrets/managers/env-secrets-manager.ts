import { Injectable, Logger } from '@nestjs/common';
import { ISecretsManager } from '../interfaces/secrets-manager.interface';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EnvSecretsManager implements ISecretsManager {
  private readonly logger = new Logger(EnvSecretsManager.name);

  constructor(private readonly configService: ConfigService) {}

  async getSecret(key: string): Promise<string | undefined> {
    // In local dev, we just read from process.env via ConfigService
    return this.configService.get<string>(key);
  }

  async getSecretOrThrow(key: string): Promise<string> {
    const value = await this.getSecret(key);
    if (!value) {
      this.logger.error(`Secret key not found: ${key}`);
      throw new Error(`Secret key not found: ${key}`);
    }
    return value;
  }
}
