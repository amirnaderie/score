// src/events/event.module.ts
import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventHandler } from './providers/event.handler';
import { ElkLoggerService } from './providers/elk/elk-logger.service';
import { ElkTestService } from './providers/elk/elk-test.service';
import { LogEventEmitterService } from './providers/elk/log-event-emitter.service';
import { LogModule } from '../log/log.module';

@Global()
@Module({
  imports: [LogModule],
  providers: [
    EventHandler,
    ElkLoggerService,
    ElkTestService,
    LogEventEmitterService,
  ],
  exports: [ElkLoggerService, ElkTestService, LogEventEmitterService],
})
export class EventModule {}
