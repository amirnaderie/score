import { HttpException, HttpStatus, InternalServerErrorException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { LogEvent } from 'src/modules/event/log.event';
import { logTypes } from 'src/modules/event/enums/logType.enum';
import { ErrorMessages } from 'src/constants/error-messages.constants';

export default function handelError(
  error: unknown,
  eventEmitter: EventEmitter2,
  fileName: string = 'unknown',
  method: string = 'unknown',
  requestBody?: any,
) {
  console.error(error);
  if (error instanceof HttpException) throw error;

  eventEmitter.emit(
    'logEvent',
    new LogEvent({
      logTypes: logTypes.ERROR,
      fileName: fileName,
      method: method,
      message: (error as Error).message || 'Unknown error occurred',
      requestBody: requestBody ? JSON.stringify(requestBody) : undefined,
      stack: (error as Error).stack,
    }),
  );
  throw new InternalServerErrorException({
    data: {},
    message: ErrorMessages.INTERNAL_ERROR,
    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
  });

}
