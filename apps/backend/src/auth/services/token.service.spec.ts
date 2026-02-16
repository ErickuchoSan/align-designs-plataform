import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TokenService } from './token.service';
import { JwtBlacklistService } from '../jwt-blacklist.service';
import { PrismaService } from '../../prisma/prisma.service';
import * as crypto from 'crypto';

describe('TokenService', () => {
  let service: TokenService;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;
  let jwtBlacklistService: jest.Mocked<JwtBlacklistService>;
  let prismaService: any;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    role: 'CLIENT',
  };

  const mockRefreshToken = 'a'.repeat(80); // 40 bytes hex = 80 chars
  const mockTokenHash = crypto.createHash('sha256').update(mockRefreshToken).digest('hex');

  const mockRefreshTokenRecord = {
    id: 'token-id-123',
    tokenHash: mockTokenHash,
    userId: 'user-123',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    createdAt: new Date(),
    revoked: false,
    replacedByToken: null,
    user: mockUser,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenService,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock-access-token'),
            decode: jest.fn(),
            verifyAsync: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('15m'),
          },
        },
        {
          provide: JwtBlacklistService,
          useValue: {
            addToBlacklist: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            refreshToken: {
              create: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              updateMany: jest.fn(),
            },
            $transaction: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TokenService>(TokenService);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
    jwtBlacklistService = module.get(JwtBlacklistService);
    prismaService = module.get(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateAccessToken', () => {
    it('should generate a JWT access token with correct payload', () => {
      const result = service.generateAccessToken(mockUser as any);

      expect(jwtService.sign).toHaveBeenCalledWith(
        {
          userId: mockUser.id,
          email: mockUser.email,
          role: mockUser.role,
        },
        expect.objectContaining({
          expiresIn: '15m',
          audience: 'align-designs-client',
          issuer: 'align-designs-api',
        }),
      );
      expect(result).toBe('mock-access-token');
    });

    it('should use configured JWT expiration', () => {
      configService.get.mockReturnValue('30m');

      service.generateAccessToken(mockUser as any);

      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          expiresIn: '30m',
        }),
      );
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a refresh token and store hash in database', async () => {
      prismaService.refreshToken.create.mockResolvedValue(mockRefreshTokenRecord);

      const result = await service.generateRefreshToken('user-123');

      expect(result).toBeDefined();
      expect(result).toHaveLength(80); // 40 bytes hex
      expect(prismaService.refreshToken.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tokenHash: expect.any(String),
          userId: 'user-123',
          expiresAt: expect.any(Date),
        }),
      });
    });

    it('should set expiration to 7 days from now', async () => {
      prismaService.refreshToken.create.mockResolvedValue(mockRefreshTokenRecord);

      await service.generateRefreshToken('user-123');

      const createCall = prismaService.refreshToken.create.mock.calls[0][0];
      const expiresAt = createCall.data.expiresAt;
      const now = new Date();
      const diffDays = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

      expect(diffDays).toBeGreaterThan(6.9);
      expect(diffDays).toBeLessThan(7.1);
    });
  });

  describe('verifyRefreshToken', () => {
    it('should return token record for valid token', async () => {
      prismaService.refreshToken.findUnique.mockResolvedValue(mockRefreshTokenRecord);

      const result = await service.verifyRefreshToken(mockRefreshToken);

      expect(result).toEqual(mockRefreshTokenRecord);
      expect(prismaService.refreshToken.findUnique).toHaveBeenCalledWith({
        where: { tokenHash: mockTokenHash },
        include: { user: true },
      });
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      prismaService.refreshToken.findUnique.mockResolvedValue(null);

      await expect(service.verifyRefreshToken('invalid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for revoked token', async () => {
      prismaService.refreshToken.findUnique.mockResolvedValue({
        ...mockRefreshTokenRecord,
        revoked: true,
      });

      await expect(service.verifyRefreshToken(mockRefreshToken)).rejects.toThrow(
        new UnauthorizedException('Refresh token revoked'),
      );
    });

    it('should throw UnauthorizedException for expired token', async () => {
      prismaService.refreshToken.findUnique.mockResolvedValue({
        ...mockRefreshTokenRecord,
        expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
      });

      await expect(service.verifyRefreshToken(mockRefreshToken)).rejects.toThrow(
        new UnauthorizedException('Refresh token expired'),
      );
    });

    it('should detect token reuse and revoke ALL tokens for user', async () => {
      // Token was already rotated (has replacedByToken set)
      prismaService.refreshToken.findUnique.mockResolvedValue({
        ...mockRefreshTokenRecord,
        replacedByToken: 'new-token-hash',
      });
      prismaService.refreshToken.updateMany.mockResolvedValue({ count: 3 });

      await expect(service.verifyRefreshToken(mockRefreshToken)).rejects.toThrow(
        new UnauthorizedException('Invalid refresh token (reused)'),
      );

      // Should revoke ALL tokens for this user (security measure)
      expect(prismaService.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-123', revoked: false },
        data: { revoked: true },
      });
    });
  });

  describe('rotateRefreshToken', () => {
    it('should revoke old token and create new one in transaction', async () => {
      prismaService.$transaction.mockResolvedValue([{}, {}]);

      const result = await service.rotateRefreshToken(mockTokenHash, 'user-123');

      expect(result).toBeDefined();
      expect(result).toHaveLength(80); // 40 bytes hex
      expect(prismaService.$transaction).toHaveBeenCalled();
    });

    it('should return a new token different from the old one', async () => {
      prismaService.$transaction.mockResolvedValue([{}, {}]);

      const newToken = await service.rotateRefreshToken(mockTokenHash, 'user-123');

      // New token should be different from the original
      expect(newToken).not.toBe(mockRefreshToken);
      expect(newToken).toHaveLength(80);
    });
  });

  describe('revokeAllRefreshTokens', () => {
    it('should revoke all non-revoked tokens for user', async () => {
      prismaService.refreshToken.updateMany.mockResolvedValue({ count: 5 });

      await service.revokeAllRefreshTokens('user-123');

      expect(prismaService.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-123', revoked: false },
        data: { revoked: true },
      });
    });
  });

  describe('revokeAccessToken', () => {
    it('should add valid token to blacklist', async () => {
      const futureExp = Math.floor(Date.now() / 1000) + 900; // 15 minutes from now
      jwtService.decode.mockReturnValue({ exp: futureExp });

      await service.revokeAccessToken('valid-token');

      expect(jwtBlacklistService.addToBlacklist).toHaveBeenCalledWith(
        'valid-token',
        expect.any(Number),
      );
    });

    it('should not blacklist already expired token', async () => {
      const pastExp = Math.floor(Date.now() / 1000) - 100; // Expired 100 seconds ago
      jwtService.decode.mockReturnValue({ exp: pastExp });

      await service.revokeAccessToken('expired-token');

      expect(jwtBlacklistService.addToBlacklist).not.toHaveBeenCalled();
    });

    it('should handle invalid token gracefully', async () => {
      jwtService.decode.mockReturnValue(null);

      await service.revokeAccessToken('invalid-token');

      expect(jwtBlacklistService.addToBlacklist).not.toHaveBeenCalled();
    });

    it('should handle token without expiration', async () => {
      jwtService.decode.mockReturnValue({ userId: '123' }); // No exp field

      await service.revokeAccessToken('no-exp-token');

      expect(jwtBlacklistService.addToBlacklist).not.toHaveBeenCalled();
    });
  });

  describe('decodeToken', () => {
    it('should decode JWT token without verification', () => {
      const mockPayload = { userId: '123', email: 'test@example.com', role: 'CLIENT' };
      jwtService.decode.mockReturnValue(mockPayload);

      const result = service.decodeToken('some-token');

      expect(result).toEqual(mockPayload);
      expect(jwtService.decode).toHaveBeenCalledWith('some-token');
    });
  });

  describe('verifyToken', () => {
    it('should verify and return payload for valid token', async () => {
      const mockPayload = { userId: '123', email: 'test@example.com', role: 'CLIENT' };
      jwtService.verifyAsync.mockResolvedValue(mockPayload);

      const result = await service.verifyToken('valid-token');

      expect(result).toEqual(mockPayload);
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      jwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

      await expect(service.verifyToken('invalid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
