// src/events/event.module.ts
import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Logs } from './entities/log.entity';
import { EventHandler } from './providers/event.handler';
import { ElkLoggerService } from './providers/elk/elk-logger.service';
import { ElkTestService } from './providers/elk/elk-test.service';
import { LogEventEmitterService } from './providers/elk/log-event-emitter.service';

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
