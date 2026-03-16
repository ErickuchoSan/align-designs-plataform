import { Injectable, UnauthorizedException } from '@nestjs/common';
import { SecretsService } from '../../secrets/secrets.service';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly secretsService: SecretsService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // First try to extract from cookie (preferred for security)
        (request: Request) => request?.cookies?.access_token,
        // Fallback to Authorization header for backward compatibility
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKeyProvider: async (
        request: Request,
        rawJwtToken: any,
        done: (err: any, secret?: string | Buffer) => void,
      ) => {
        try {
          const secret = await this.secretsService.getSecret('JWT_SECRET');
          if (!secret) {
            return done(new Error('JWT_SECRET not found'));
          }
          done(null, secret);
        } catch (err) {
          done(err);
        }
      },
      audience: 'align-designs-client',
      issuer: 'align-designs-api',
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: payload.userId,
        deletedAt: null, // Prevent soft-deleted users from authenticating
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Unauthorized user');
    }

    // Return UserPayload format with userId instead of id
    return {
      userId: user.id,
      email: user.email,
      role: user.role,
    };
  }
}
