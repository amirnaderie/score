import { Injectable } from '@nestjs/common';
import { ElkLoggerService } from './elk-logger.service';

@Injectable()
export class ElkTestService {
  constructor(private readonly elkLoggerService: ElkLoggerService) {}

  async testElkLogging() {
    await this.elkLoggerService.info({
      message: 'Test log message from Score Backend',
      test: true,
      timestamp: new Date().toISOString(),
      service: 'score-backend',
      environment: process.env.ENV || 'dev',
    });

    await this.elkLoggerService.error({
      message: 'Test error log from Score Backend',
      test: true,
      timestamp: new Date().toISOString(),
      service: 'score-backend',
      environment: process.env.ENV || 'dev',
    });

    return 'ELK logging test completed. Check Kibana at http://localhost:5601';
  }
}