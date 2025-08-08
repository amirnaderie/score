// src/errors/error.handler.ts
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Logs } from './entities/log.entity';
import { Repository } from 'typeorm';
import { LogParams } from './interfaces/log.interface';
import { LogEvent } from './log.event';
import { ElkLoggerService } from './elk-logger.service';

@Injectable()
export class EventHandler {
  constructor(
    @InjectRepository(Logs)
    private readonly LogRepository: Repository<Logs>,
    private readonly elkLoggerService: ElkLoggerService,
  ) {}

  @OnEvent('logEvent')
  async handleLogEvent(logEvent: LogEvent) {
    const logParams = logEvent.getLogParams();
    const { fileName, logTypes, message, method, stack, requestBody } =
      logParams;

    try {
      // Save to database
      const logData = this.LogRepository.create({
        fileName,
        logTypes,
        message,
        method,
        stack,
        requestBody,
      });
      await this.LogRepository.save(logData);

      // Send to ELK stack
      await this.elkLoggerService.info({
        fileName,
        logTypes,
        message,
        method,
        stack,
        requestBody,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.log('Error in Logging', error);
      await this.elkLoggerService.error({
        message: 'Error in Logging',
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      });
    }
  }
}
