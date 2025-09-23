// src/errors/error.handler.ts
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ElkLoggerService } from './elk/elk-logger.service';
import { LogEvent } from './log.event';
import { LogService } from 'src/modules/log/provider/log.service';

@Injectable()
export class EventHandler {
  constructor(
    private readonly logService: LogService,
    private readonly elkLoggerService: ElkLoggerService,
  ) { }

  @OnEvent('logEvent')
  async handleLogEvent(logEvent: LogEvent) {
    const logParams = logEvent.getLogParams();
    const { fileName, logTypes, message, method, stack, requestBody, correlationId } =
      logParams;

    try {
      // Save to database
      const logData = this.logService.createLog({
        fileName,
        logTypes,
        message,
        method,
        stack,
        requestBody,
        correlationId, // Use the correct field name
      });
      //await this.LogRepository.save(logData);

      // Send to ELK stack
      // await this.elkLoggerService.info({
      //   fileName,
      //   logTypes,
      //   message,
      //   method,
      //   stack,
      //   requestBody,
      //   correlationId,
      //   timestamp: new Date().toISOString(),
      // });
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
