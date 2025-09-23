import { Controller, Get, Req } from '@nestjs/common';
import { Request } from 'express';
import { CorrelationService } from './correlation.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { LogEvent } from '../event/providers/log.event';
import { logTypes } from '../log/enums/logType.enum';

@Controller('correlation-test')
export class CorrelationController {
  constructor(
    private readonly correlationService: CorrelationService,
    private eventEmitter: EventEmitter2,
  ) {}

  @Get('test')
  async testCorrelationId(@Req() req: Request) {
    const correlationId = this.correlationService.getCorrelationId();
    
    // Log a test message with correlation ID
    this.eventEmitter.emit(
      'logEvent',
      new LogEvent({
        logTypes: logTypes.INFO,
        fileName: 'correlation.controller',
        method: 'testCorrelationId',
        message: 'Test log with correlation ID',
        requestBody: JSON.stringify({ test: 'correlation-id' }),
        stack: null,
      }),
    );
    
    return {
      message: 'Correlation ID test successful',
      correlationId: correlationId,
      requestId: (req as any).correlationId,
    };
  }
}