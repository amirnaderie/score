import { Module, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Log } from './entities/log.entity';
import { LogService } from './provider/log.service';
import { LogController } from './controller/log.controller';
import { APP_PIPE } from '@nestjs/core';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Log]),AuthModule],
  controllers: [LogController],
  providers: [
    LogService,
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    },
  ],
  exports: [LogService],
})
export class LogModule {}