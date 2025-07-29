import { Module, Global } from '@nestjs/common';
import Redis from 'ioredis'; // Correct
import { ConfigModule, ConfigService } from '@nestjs/config';

@Global()
@Module({
  imports: [ConfigModule], // Import ConfigModule to access environment variables
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: (configService: ConfigService) => {
        return new Redis({
          host: configService.get<string>('REDIS_HOST'),
          port: parseInt(configService.get<string>('REDIS_PORT')!),
          password: configService.get<string>('REDIS_PASSWORD'),
          // db: configService.get<number>('REDIS_DB') || 0,
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: ['REDIS_CLIENT'], // Export the Redis client so it can be used in other modules
})
export class RedisModule {}
