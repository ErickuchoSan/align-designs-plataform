import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtBlacklistService } from '../jwt-blacklist.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly jwtBlacklistService: JwtBlacklistService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // First, run the default JWT validation
    const isValid = await super.canActivate(context);

    if (!isValid) {
      return false;
    }

    // Extract the token from the request
    const token = this.extractTokenFromRequest(request);

    if (!token) {
      throw new UnauthorizedException('Token not found');
    }

    // Check if the token is blacklisted
    if (this.jwtBlacklistService.isBlacklisted(token)) {
      throw new UnauthorizedException('Token has been revoked');
    }

    return true;
  }

  private extractTokenFromRequest(request: {
    headers?: Record<string, string | string[] | undefined>;
    cookies?: Record<string, string>;
  }): string | null {
    // Check Authorization header first
    const authHeader = request.headers?.authorization;
    const authHeaderValue = Array.isArray(authHeader)
      ? authHeader[0]
      : authHeader;
    if (authHeaderValue && authHeaderValue.startsWith('Bearer ')) {
      return authHeaderValue.substring(7);
    }

    // Check httpOnly cookie as fallback
    const cookieToken = request.cookies?.access_token;
    if (cookieToken) {
      return cookieToken;
    }

    return null;
  }
}
