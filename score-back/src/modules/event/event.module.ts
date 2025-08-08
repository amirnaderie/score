// src/events/event.module.ts
import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Logs } from './entities/log.entity';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { EventEmitter2 } from 'eventemitter2';
import { EventHandler } from './event.handler';
import { ElkLoggerService } from './elk-logger.service';
import { ElkTestService } from './elk-test.service';
import { LogEventEmitterService } from './log-event-emitter.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Logs])],
  providers: [
    EventHandler,
    ElkLoggerService,
    ElkTestService,
    LogEventEmitterService,
  ],
  exports: [ElkLoggerService, ElkTestService, LogEventEmitterService],
})
export class EventModule {}
