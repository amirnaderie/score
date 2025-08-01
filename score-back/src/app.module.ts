import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ScoreModule } from './modules/score/score.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import typeormConfig from './config/typeorm.config';
import { DynamicThrottleGuard } from './guards/dynamic-throttle.guard';
import { APP_GUARD } from '@nestjs/core';
import { EventModule } from './modules/event/event.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AuthModule } from './modules/auth/auth.module';
import { CacheModule } from '@nestjs/cache-manager';
@Module({
  imports: [
    CacheModule.register(),
    EventEmitterModule.forRoot(),
    EventModule,
    ConfigModule.forRoot({
      envFilePath: process.env.ENV ? `.env.${process.env.ENV}` : undefined,
      isGlobal: true,
      cache: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: typeormConfig().useFactory,
    }),
    ScoreModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: DynamicThrottleGuard,
    },
  ],
})
export class AppModule {}
