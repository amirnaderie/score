import { LogParams } from '../interfaces/log.interface';
import { CorrelationService } from '../../correlation/correlation.service';

export class LogEvent {
  private logParams: LogParams;

  constructor(logParams: LogParams) {
    // Automatically inject correlation ID if not provided
    if (!logParams.correlationId) {
      logParams.correlationId = CorrelationService.getCorrelationId();
    }
    this.logParams = logParams;
  }

  getLogParams(): LogParams {
    return this.logParams;
  }
}
