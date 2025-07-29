// src/errors/error.handler.ts
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Logs } from './entities/log.entity';
import { Repository } from 'typeorm';
import { LogParams } from './interfaces/log.interface';
import { LogEvent } from './log.event';

@Injectable()
export class EventHandler {
  constructor(
    @InjectRepository(Logs)
    private readonly LogRepository: Repository<Logs>,
  ) {}

  @OnEvent('logEvent')
  async handleLogEvent(logEvent: LogEvent) {
    const logParams = logEvent.getLogParams();
    const {
      fileName,
      logTypes,
      message,
      method,
      stack,
      lineNumber,
      requestBody,
    } = logParams;
    try {
      const logData = this.LogRepository.create({
        fileName,
        logTypes,
        message,
        method,
        stack,
        lineNumber,
        requestBody,
      });
      await this.LogRepository.save(logData);
    } catch (error) {
      console.log('Error in Logging', error);
    }
  }
}
