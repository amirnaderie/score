import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { LogParams } from '../../interfaces/log.interface';
import { LogEvent } from '../log.event';
import { logTypes } from '../../../log/enums/logType.enum';
import { CorrelationService } from 'src/modules/correlation/correlation.service';

@Injectable()
export class LogEventEmitterService {
  constructor(private eventEmitter: EventEmitter2) {}

  emitLog(logParams: LogParams) {
    const { fileName, logTypes, message, method, stack, requestBody } =
      logParams;
    
    // Ensure correlation ID is included
    const correlationId = logParams.correlationId || CorrelationService.getCorrelationId();
    
    const logEvent = new LogEvent({
      fileName,
      logTypes,
      message,
      method,
      stack,
      requestBody,
      correlationId,
    });

    this.eventEmitter.emit('logEvent', logEvent);
  }

  emitApiLog(
    fileName: string,
    method: string,
    message: string,
    requestBody?: any,
    stack?: string,
  ) {
    this.emitLog({
      fileName,
      logTypes: logTypes.WARNING,
      message,
      method,
      stack,
      requestBody,
    });
  }

  emitErrorLog(
    fileName: string,
    method: string,
    message: string,
    error: Error,
    requestBody?: any,
  ) {
    this.emitLog({
      fileName,
      logTypes: logTypes.ERROR,
      message,
      method,
      stack: error.stack,
      requestBody,
    });
  }

  emitInfoLog(fileName: string, method: string, message: string, data?: any) {
    this.emitLog({
      fileName,
      logTypes: logTypes.INFO,
      message,
      method,
      stack: undefined,
      requestBody: data,
    });
  }
}
