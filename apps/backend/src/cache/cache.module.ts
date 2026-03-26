import { Module } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Keyv from 'keyv';
import KeyvRedis from '@keyv/redis';
import { CacheManagerService } from './services/cache-manager.service';

@Module({
  imports: [
    NestCacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const redisEnabled =
          configService.get<string>('REDIS_ENABLED', 'false') === 'true';

        if (!redisEnabled) {
          // Use in-memory cache if Redis is disabled (development)
          return {
            ttl: 5 * 60 * 1000, // 5 minutes default TTL
            max: 100, // Maximum number of items in cache
          };
        }

        // Use Redis store if enabled (production)
        const redisUrl =
          configService.get<string>('REDIS_URL') ||
          `redis://${configService.get<string>('REDIS_HOST', 'localhost')}:${configService.get<number>('REDIS_PORT', 6379)}`;

        return {
          stores: [
            new Keyv({
              store: new KeyvRedis(redisUrl),
              ttl: 5 * 60 * 1000, // 5 minutes default TTL
            }),
          ],
        };
      },
      inject: [ConfigService],
      isGlobal: true, // Make cache available globally
    }),
  ],
  providers: [CacheManagerService],
  exports: [NestCacheModule, CacheManagerService],
})
export class CacheModule {}
