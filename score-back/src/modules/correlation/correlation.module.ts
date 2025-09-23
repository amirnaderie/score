import { Module, Global } from '@nestjs/common';
import { CorrelationService } from './correlation.service';
import { CorrelationController } from './correlation.controller';

@Global()
@Module({
  controllers: [CorrelationController],
  providers: [CorrelationService],
  exports: [CorrelationService],
})
export class CorrelationModule {}