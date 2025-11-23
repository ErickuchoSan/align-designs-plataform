import { Module } from '@nestjs/common';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtBlacklistService } from './jwt-blacklist.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AccountLockoutService } from './services/account-lockout.service';
import { PasswordService } from './services/password.service';
import { AuthDependenciesService } from './services/auth-dependencies.service';
import { OtpModule } from '../otp/otp.module';
import { EmailModule } from '../email/email.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): JwtModuleOptions => {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret) {
          throw new Error(
            'JWT_SECRET is required. Please set it in your environment variables.',
          );
        }
        return {
          secret,
          signOptions: {
            expiresIn: configService.get('JWT_EXPIRATION') ?? '1d',
          },
        };
      },
    }),
    OtpModule,
    EmailModule,
    AuditModule,
  ],
  providers: [
    AuthService,
    JwtStrategy,
    JwtBlacklistService,
    JwtAuthGuard,
    AccountLockoutService,
    PasswordService,
    AuthDependenciesService,
  ],
  controllers: [AuthController],
  exports: [
    AuthService,
    JwtStrategy,
    JwtBlacklistService,
    JwtAuthGuard,
    AccountLockoutService,
    PasswordService,
  ],
})
export class AuthModule {}
