import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ElkTestService } from './modules/event/elk-test.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly elkTestService: ElkTestService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('test-elk')
  async testElk() {
    await this.elkTestService.testElkLogging();
    return 'ELK logging test initiated. Check Kibana at http://localhost:5601';
  }
}
