import {
  HttpException,
  HttpStatus,
  InternalServerErrorException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { LogEvent } from 'src/modules/event/providers/log.event';
import { logTypes } from 'src/modules/log/enums/logType.enum';
import { ErrorMessages } from 'src/constants/error-messages.constants';
import { CorrelationService } from 'src/modules/correlation/correlation.service';

export default function handelError(
  error: unknown,
  eventEmitter: EventEmitter2,
  fileName: string = 'unknown',
  method: string = 'unknown',
  requestBody?: any,
) {
  console.error(error);
  if (error instanceof HttpException) throw error;

  const correlationId = CorrelationService.getCorrelationId();

  eventEmitter.emit(
    'logEvent',
    new LogEvent({
      logTypes: logTypes.ERROR,
      fileName: fileName,
      method: method,
      message: (error as Error).message || 'Unknown error occurred',
      requestBody: requestBody ? JSON.stringify(requestBody) : undefined,
      stack: (error as Error).stack,
      correlationId,
    }),
  );
  throw new InternalServerErrorException({
    data: {},
    message: ErrorMessages.INTERNAL_ERROR,
    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
  });
}
