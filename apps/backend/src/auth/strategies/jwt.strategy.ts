import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const jwtSecret = configService.get<string>('JWT_SECRET');

    if (!jwtSecret) {
      throw new Error(
        'JWT_SECRET is not configured. Please set JWT_SECRET in your environment variables.',
      );
    }

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // First try to extract from cookie (preferred for security)
        (request: Request) => {
          const token = request?.cookies?.access_token;
          if (!token) {
            const fs = require('fs');
            const log = `[JWT] Missing cookie. Cookies: ${JSON.stringify(request?.cookies)} URL: ${request?.url} Method: ${request?.method}\n`;
            try { fs.appendFileSync('auth_debug.log', log); } catch (e) { }
          }
          return token;
        },
        // Fallback to Authorization header for backward compatibility
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
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
