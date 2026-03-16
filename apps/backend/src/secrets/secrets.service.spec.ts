import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SecretsService } from './secrets.service';
import { EnvSecretsManager } from './managers/env-secrets-manager';
import { AwsSecretsManager } from './managers/aws-secrets-manager';

describe('SecretsService', () => {
  let service: SecretsService;
  let configService: ConfigService;
  let envSecretsManager: EnvSecretsManager;
  let awsSecretsManager: AwsSecretsManager;

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockEnvSecretsManager = {
    getSecret: jest.fn(),
    getSecretOrThrow: jest.fn(),
  };

  const mockAwsSecretsManager = {
    getSecret: jest.fn(),
    getSecretOrThrow: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SecretsService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: EnvSecretsManager, useValue: mockEnvSecretsManager },
        { provide: AwsSecretsManager, useValue: mockAwsSecretsManager },
      ],
    }).compile();

    service = module.get<SecretsService>(SecretsService);
    configService = module.get<ConfigService>(ConfigService);
    envSecretsManager = module.get<EnvSecretsManager>(EnvSecretsManager);
    awsSecretsManager = module.get<AwsSecretsManager>(AwsSecretsManager);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should use EnvSecretsManager when USE_AWS_SECRETS is false', () => {
      mockConfigService.get.mockReturnValue('false');
      service.onModuleInit();
      // Access private property for testing or test behavior
      // Since connectionManager is private, we test behavior:
      mockEnvSecretsManager.getSecret.mockResolvedValue('value');
      service.getSecret('KEY');
      expect(mockEnvSecretsManager.getSecret).toHaveBeenCalledWith('KEY');
      expect(mockAwsSecretsManager.getSecret).not.toHaveBeenCalled();
    });

    it('should use AwsSecretsManager when USE_AWS_SECRETS is true', () => {
      mockConfigService.get.mockReturnValue('true');
      service.onModuleInit();
      mockAwsSecretsManager.getSecret.mockResolvedValue('value');
      service.getSecret('KEY');
      expect(mockAwsSecretsManager.getSecret).toHaveBeenCalledWith('KEY');
      expect(mockEnvSecretsManager.getSecret).not.toHaveBeenCalled();
    });
  });

  describe('getSecret', () => {
    it('should delegate to the active manager', async () => {
      mockConfigService.get.mockReturnValue('false');
      service.onModuleInit();
      mockEnvSecretsManager.getSecret.mockResolvedValue('secret-value');

      const result = await service.getSecret('TEST_KEY');
      expect(result).toBe('secret-value');
      expect(mockEnvSecretsManager.getSecret).toHaveBeenCalledWith('TEST_KEY');
    });

    it('should return undefined if secret not found', async () => {
      mockConfigService.get.mockReturnValue('false');
      service.onModuleInit();
      mockEnvSecretsManager.getSecret.mockResolvedValue(undefined);

      const result = await service.getSecret('MISSING_KEY');
      expect(result).toBeUndefined();
    });
  });

  describe('getSecretOrThrow', () => {
    it('should return value if found', async () => {
      mockConfigService.get.mockReturnValue('false');
      service.onModuleInit();
      mockEnvSecretsManager.getSecretOrThrow.mockResolvedValue('secret-value');

      const result = await service.getSecretOrThrow('TEST_KEY');
      expect(result).toBe('secret-value');
    });

    it('should throw if secret not found (delegated)', async () => {
      mockConfigService.get.mockReturnValue('false');
      service.onModuleInit();
      mockEnvSecretsManager.getSecretOrThrow.mockRejectedValue(
        new Error('Secret key not found'),
      );

      await expect(service.getSecretOrThrow('MISSING_KEY')).rejects.toThrow(
        'Secret key not found',
      );
    });
  });
});
